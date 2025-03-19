// src/api/grcService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

let lastSuccessfulQuestion = null; // Cache a successful question as backup

export const streamGRCQuestion = async (category = 'Random', difficulty = 'Easy') => {
  try {
    console.log("Requesting GRC question:", { category, difficulty });
    
    const response = await apiClient.post(
      API.GRC.STREAM_QUESTION,
      { category, difficulty },
      {
        responseType: 'text'  // Get as raw text
      }
    );
    
    let responseText = response.data || '';
    console.log("Raw GRC response (first 100 chars):", responseText.substring(0, 100));
    
    // Clean up the response text - remove markdown, whitespace, etc.
    responseText = cleanResponseText(responseText);
    
    try {
      // First try to parse as is
      const jsonData = safeJsonParse(responseText);
      if (jsonData) {
        console.log("Successfully parsed GRC question without fixes");
        lastSuccessfulQuestion = jsonData;
        return jsonData;
      }
      
      // If that fails, try more aggressive fixes
      console.log("Initial parse failed, attempting JSON fixes...");
      
      // Attempt Fix 1: Replace all numeric keys with quoted keys in the entire JSON
      const fixedJsonText1 = fixNumericKeys(responseText);
      const jsonData1 = safeJsonParse(fixedJsonText1);
      
      if (jsonData1) {
        console.log("Successfully parsed GRC question with Fix 1");
        lastSuccessfulQuestion = jsonData1;
        return jsonData1;
      }
      
      // Attempt Fix 2: More aggressive quoting of all possible keys
      const fixedJsonText2 = quoteAllPossibleKeys(responseText);
      const jsonData2 = safeJsonParse(fixedJsonText2);
      
      if (jsonData2) {
        console.log("Successfully parsed GRC question with Fix 2");
        lastSuccessfulQuestion = jsonData2;
        return jsonData2;
      }
      
      // Attempt Fix 3: Try reconstructing the JSON from scratch
      const jsonData3 = reconstructJson(responseText);
      
      if (jsonData3) {
        console.log("Successfully parsed GRC question with Fix 3");
        lastSuccessfulQuestion = jsonData3;
        return jsonData3;
      }
      
      throw new Error("Failed to parse JSON after multiple attempts");
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      
      // If we have a previously successful question, use that as fallback
      if (lastSuccessfulQuestion) {
        console.log("Using last successful question as fallback");
        return lastSuccessfulQuestion;
      }
      
      // Otherwise, provide the default fallback
      return getDefaultQuestion();
    }
  } catch (error) {
    console.error('Error streaming GRC question:', error);
    
    // Return a previously successful question if available
    if (lastSuccessfulQuestion) {
      console.log("Using last successful question as fallback after error");
      return lastSuccessfulQuestion;
    }
    
    // Fallback to a default question
    return getDefaultQuestion();
  }
};

// Helper function to safely parse JSON
function safeJsonParse(text) {
  try {
    const data = JSON.parse(text);
    
    // Validate that the data has the required fields
    if (data && 
        typeof data.question === 'string' && 
        Array.isArray(data.options) && 
        data.options.length === 4 &&
        typeof data.correct_answer_index !== 'undefined' &&
        data.explanations) {
      
      // Ensure all explanations keys are strings
      const fixedExplanations = {};
      Object.keys(data.explanations).forEach(key => {
        fixedExplanations[String(key)] = data.explanations[key];
      });
      data.explanations = fixedExplanations;
      
      return data;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Helper function to clean response text
function cleanResponseText(text) {
  // Remove markdown code blocks
  if (text.includes('```json')) {
    text = text.replace(/```json\n?|\n?```/g, '');
  } else if (text.includes('```')) {
    text = text.replace(/```\n?|\n?```/g, '');
  }
  
  return text.trim();
}

// Helper function to fix numeric keys in JSON
function fixNumericKeys(text) {
  // This regex looks for numeric keys in any object, not just explanations
  return text.replace(/(\{|\,)\s*(\d+)\s*\:/g, '$1"$2":');
}

// Helper function for more aggressive fix - quote all possible keys
function quoteAllPossibleKeys(text) {
  // This regex tries to quote any unquoted key in an object
  return text.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
}

// Try to extract the JSON structure from the text and rebuild it
function reconstructJson(text) {
  try {
    // Extract key parts from the text
    const questionMatch = text.match(/"question"\s*:\s*"([^"]+)"/);
    const question = questionMatch ? questionMatch[1] : null;
    
    // Extract options array
    const optionsMatch = text.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
    let options = [];
    
    if (optionsMatch) {
      const optionsText = optionsMatch[1];
      // Parse individual options
      const optionRegex = /"([^"]+)"/g;
      let optionMatch;
      while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
        options.push(optionMatch[1]);
      }
    }
    
    // Extract correct answer index
    const correctIndexMatch = text.match(/"correct_answer_index"\s*:\s*(\d+)/);
    const correctIndex = correctIndexMatch ? parseInt(correctIndexMatch[1]) : 0;
    
    // Extract explanations - this is complex so we'll simplify
    const explanations = {};
    for (let i = 0; i < 4; i++) {
      explanations[i.toString()] = `Explanation for option ${i}`;
    }
    
    // Extract exam tip
    const examTipMatch = text.match(/"exam_tip"\s*:\s*"([^"]+)"/);
    const examTip = examTipMatch ? examTipMatch[1] : "Remember the key concepts!";
    
    // If we have at least question and options, we can reconstruct
    if (question && options.length === 4) {
      return {
        question,
        options,
        correct_answer_index: correctIndex,
        explanations,
        exam_tip: examTip
      };
    }
    
    return null;
  } catch (e) {
    console.error("Error reconstructing JSON:", e);
    return null;
  }
}

// Get a default fallback question
function getDefaultQuestion() {
  return {
    question: "Which of the following best describes the concept of defense in depth?",
    options: [
      "A single, highly secure control protecting critical assets",
      "Multiple layers of security controls throughout an organization",
      "The practice of hiding sensitive information from attackers",
      "A strategy focused exclusively on perimeter security"
    ],
    correct_answer_index: 1,
    explanations: {
      "0": "This is incorrect. Defense in depth is not about relying on a single control, no matter how secure. The correct answer is that defense in depth involves multiple layers of security controls. A single control creates a single point of failure.",
      "1": "Correct. Defense in depth involves implementing multiple layers of security controls (administrative, technical, and physical) throughout an organization to protect its assets. If one layer fails, other layers continue to provide protection.",
      "2": "This is incorrect. What you're describing is security through obscurity, not defense in depth. The correct answer is that defense in depth involves multiple layers of security controls. While obscurity might be one element, it should never be the primary strategy.",
      "3": "This is incorrect. Defense in depth is not exclusively focused on perimeter security. The correct answer is that it involves multiple layers of security controls throughout an organization. Perimeter security is just one layer in a defense in depth strategy."
    },
    exam_tip: "Think of defense in depth like a medieval castle: moat, walls, guards, locked doors - not just one barrier!"
  };
}
