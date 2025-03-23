// src/components/FormattedQuestion.js
import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enhanced syntax highlighting colors
const syntaxColors = {
  keyword: '#C792EA',   // Purple for keywords (if, else, function, etc)
  string: '#C3E88D',    // Green for strings
  number: '#F78C6C',    // Orange for numbers
  comment: '#546E7A',   // Gray-blue for comments
  function: '#82AAFF',  // Light blue for functions
  operator: '#89DDFF',  // Cyan for operators
  variable: '#EEFFFF',  // White-ish for variables
  property: '#FFCB6B',  // Yellow for properties
  type: '#FF5370',      // Red for types
  class: '#FFCB6B',     // Yellow for class names
  constant: '#89DDFF',  // Light blue for constants
  default: '#E2E2E2',   // Default text color
};

// List of keywords for enhanced syntax highlighting
const keywords = [
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
  'class', 'import', 'export', 'from', 'try', 'catch', 'throw', 'switch', 
  'case', 'default', 'break', 'continue', 'typeof', 'instanceof', 'new',
  'true', 'false', 'null', 'undefined', 'this', 'await', 'async', 'yield',
  'delete', 'do', 'in', 'of', 'super', 'extends', 'implements', 'interface',
  'static', 'private', 'public', 'protected', 'package', 'void', 
];

// Type keywords
const typeKeywords = [
  'string', 'number', 'boolean', 'any', 'void', 'object', 'array',
  'never', 'undefined', 'null', 'symbol', 'bigint', 'unknown',
  'int', 'float', 'double', 'long', 'char', 'byte', 'short',
];

// Multi-line comment patterns
const commentPatterns = [
  { start: '//', end: '\n' },
  { start: '/*', end: '*/' },
  { start: '#', end: '\n' },  // For Python and other languages
];

/**
 * FormattedQuestion component handles rich text formatting for questions in React Native
 * Enhanced version with syntax highlighting, word wrap toggle, and zoom functionality for code blocks
 * 
 * @param {string} questionText - The text of the question to format
 * @returns {JSX.Element} - Formatted question component
 */
const FormattedQuestion = ({ questionText }) => {
  // State for the zoom level of code blocks
  const [codeZoomLevel, setCodeZoomLevel] = useState(1);
  // State for word wrap in code blocks
  const [wordWrapEnabled, setWordWrapEnabled] = useState(true);
  
  // Process the question text to handle formatting
  const processedContent = useMemo(() => {
    // Return empty array if no question text
    if (!questionText) return [];
    
    // Split the content by code blocks first
    const parts = [];
    let lastIndex = 0;
    
    // Find all code blocks (both triple backtick and single backtick)
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```|`([^`]+)`/g;
    let match;
    
    while ((match = codeBlockRegex.exec(questionText)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: questionText.substring(lastIndex, match.index)
        });
      }
      
      // Check if this is a triple backtick code block or inline code
      if (match[2]) {
        // Triple backtick code block
        parts.push({
          type: 'code-block',
          language: match[1] || 'plaintext',
          content: match[2]
        });
      } else {
        // Inline code
        parts.push({
          type: 'inline-code',
          content: match[3]
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < questionText.length) {
      parts.push({
        type: 'text',
        content: questionText.substring(lastIndex)
      });
    }
    
    // Process tables in text parts
    const processedParts = parts.map(part => {
      if (part.type !== 'text') return part;
      
      // Check for table patterns
      if (part.content.includes('|') && part.content.includes('\n') &&
          part.content.match(/\|[\s-]+\|/)) {
        return {
          type: 'table',
          content: part.content
        };
      }
      
      // Check for ASCII diagrams (lines with lots of special chars like -│┌┐└┘)
      if (part.content.match(/[│├┤┌┐└┘┬┴┼─|/\\+*=><^v]/g) && 
          part.content.split('\n').some(line => 
            (line.match(/[│├┤┌┐└┘┬┴┼─|/\\+*=><^v]/g) || []).length > 5)) {
        return {
          type: 'ascii-diagram',
          content: part.content
        };
      }
      
      return part;
    });
    
    return processedParts;
  }, [questionText]);

  // Apply enhanced syntax highlighting to code
  const applySyntaxHighlighting = (code, language) => {
    // For non-code languages, just return the text
    if (!language || ['plaintext', 'text', 'output'].includes(language.toLowerCase())) {
      return <Text style={styles.codeText}>{code}</Text>;
    }

    const lines = code.split('\n');
    
    // Process multi-line comments
    const commentRanges = [];
    let inComment = false;
    let commentStart = -1;
    let currentCommentPattern = null;

    // Find all comment ranges
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!inComment) {
        // Check for comment start
        for (const pattern of commentPatterns) {
          const startIdx = line.indexOf(pattern.start);
          if (startIdx !== -1) {
            inComment = true;
            commentStart = i;
            currentCommentPattern = pattern;
            
            // Check if comment ends on the same line
            const endIdx = line.indexOf(pattern.end, startIdx + pattern.start.length);
            if (endIdx !== -1 || pattern.end === '\n') {
              inComment = false;
              commentRanges.push({ start: { line: i, index: startIdx }, end: { line: i, index: endIdx !== -1 ? endIdx + pattern.end.length : line.length } });
            }
            break;
          }
        }
      } else if (inComment && currentCommentPattern) {
        // Check for comment end
        const endIdx = line.indexOf(currentCommentPattern.end);
        if (endIdx !== -1 || currentCommentPattern.end === '\n') {
          inComment = false;
          commentRanges.push({ 
            start: { line: commentStart, index: 0 }, 
            end: { line: i, index: endIdx !== -1 ? endIdx + currentCommentPattern.end.length : line.length } 
          });
        }
      }
    }
    
    return (
      <>
        {lines.map((line, lineIndex) => {
          // Skip empty lines
          if (!line.trim()) {
            return <Text key={lineIndex} style={styles.codeText}>{'\n'}</Text>;
          }

          // Check if this entire line is in a comment
          const isInComment = commentRanges.some(range => 
            (lineIndex > range.start.line && lineIndex < range.end.line) ||
            (lineIndex === range.start.line && lineIndex === range.end.line && range.start.index === 0 && range.end.index === line.length) ||
            (lineIndex === range.start.line && range.start.index === 0 && range.end.line > lineIndex) ||
            (lineIndex === range.end.line && range.end.index === line.length && range.start.line < lineIndex)
          );

          if (isInComment) {
            return <Text key={lineIndex} style={[styles.codeText, { color: syntaxColors.comment }]}>{line}{lineIndex < lines.length - 1 ? '\n' : ''}</Text>;
          }

          // Split by tokens while preserving whitespace
          const tokens = [];
          let currentToken = '';
          let inString = false;
          let stringChar = '';
          let inLineComment = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            // Check for line comments
            if (!inString && !inLineComment && 
                ((char === '/' && i + 1 < line.length && line[i+1] === '/') || 
                 (char === '#' && language.toLowerCase() !== 'html'))) {
              if (currentToken) {
                tokens.push({ type: 'code', content: currentToken });
                currentToken = '';
              }
              tokens.push({ type: 'comment', content: line.substring(i) });
              break;
            }
            
            // Handle strings
            if ((char === '"' || char === "'" || char === '`') && 
                (i === 0 || line[i-1] !== '\\')) {
              if (inString && char === stringChar) {
                // End of string
                currentToken += char;
                tokens.push({ type: 'string', content: currentToken });
                currentToken = '';
                inString = false;
              } else if (!inString) {
                // Start of string
                if (currentToken) {
                  tokens.push({ type: 'code', content: currentToken });
                  currentToken = '';
                }
                currentToken += char;
                inString = true;
                stringChar = char;
              } else {
                // Different string char inside a string
                currentToken += char;
              }
              continue;
            }
            
            if (inString) {
              currentToken += char;
              continue;
            }
            
            // Handle operators
            if (/[=+\-*/<>!&|^%:;,.(){}[\]]/.test(char)) {
              if (currentToken) {
                tokens.push({ type: 'code', content: currentToken });
                currentToken = '';
              }
              tokens.push({ type: 'operator', content: char });
              continue;
            }
            
            // Handle whitespace
            if (/\s/.test(char)) {
              currentToken += char;
              continue;
            }
            
            // Check if this starts a number
            if (/[0-9]/.test(char) && !/[a-zA-Z0-9_]/.test(currentToken[currentToken.length - 1] || '')) {
              if (currentToken) {
                tokens.push({ type: 'code', content: currentToken });
                currentToken = '';
              }
              let j = i;
              let numberToken = '';
              while (j < line.length && /[0-9.]/.test(line[j])) {
                numberToken += line[j];
                j++;
              }
              tokens.push({ type: 'number', content: numberToken });
              i = j - 1;
              continue;
            }
            
            // Add to current token
            currentToken += char;
          }
          
          // Add any remaining token
          if (currentToken) {
            tokens.push({ type: inString ? 'string' : 'code', content: currentToken });
          }
          
          // Process tokens to identify keywords, types, functions, etc.
          const processedTokens = tokens.map((token, i) => {
            if (token.type === 'code') {
              const content = token.content.trim();
              
              // Check for keywords
              if (keywords.includes(content)) {
                return { ...token, type: 'keyword' };
              }
              
              // Check for type keywords
              if (typeKeywords.includes(content)) {
                return { ...token, type: 'type' };
              }
              
              // Check for constants (all caps with underscores)
              if (/^[A-Z][A-Z0-9_]*$/.test(content)) {
                return { ...token, type: 'constant' };
              }
              
              // Check for class names (PascalCase)
              if (/^[A-Z][a-zA-Z0-9]*$/.test(content)) {
                return { ...token, type: 'class' };
              }
              
              // Check for function declarations/calls
              if (i < tokens.length - 1 && 
                 (tokens[i+1].content === '(' || /^\s*\(/.test(tokens[i+1].content))) {
                return { ...token, type: 'function' };
              }
              
              // Check for property access
              if (i > 0 && 
                 (tokens[i-1].content === '.' || /\.\s*$/.test(tokens[i-1].content))) {
                return { ...token, type: 'property' };
              }
            }
            return token;
          });
          
          // Render line with syntax highlighting
          return (
            <Text key={lineIndex} style={[styles.codeText, { fontSize: 9 * codeZoomLevel }]}>
              {processedTokens.map((token, tokenIndex) => {
                let color;
                switch(token.type) {
                  case 'keyword': color = syntaxColors.keyword; break;
                  case 'string': color = syntaxColors.string; break;
                  case 'number': color = syntaxColors.number; break;
                  case 'comment': color = syntaxColors.comment; break;
                  case 'operator': color = syntaxColors.operator; break;
                  case 'function': color = syntaxColors.function; break;
                  case 'property': color = syntaxColors.property; break;
                  case 'type': color = syntaxColors.type; break;
                  case 'class': color = syntaxColors.class; break;
                  case 'constant': color = syntaxColors.constant; break;
                  default: color = syntaxColors.default;
                }
                
                return (
                  <Text 
                    key={tokenIndex} 
                    style={[styles.codeText, { color, fontSize: 9 * codeZoomLevel }]}
                  >
                    {token.content}
                  </Text>
                );
              })}
              {lineIndex < lines.length - 1 ? '\n' : ''}
            </Text>
          );
        })}
      </>
    );
  };

  // Function to parse and render a table
  const renderTable = (tableText) => {
    const lines = tableText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return (
        <Text style={styles.plainText}>{tableText}</Text>
      );
    }

    // Check if the second line contains a separator row (e.g., |------|------|)
    const isMarkdownTable = lines[1].match(/\|[-:\s]+\|/);
    
    if (!isMarkdownTable) {
      // Treat as pre-formatted text if not a markdown table
      return (
        <Text style={styles.preformattedText}>{tableText}</Text>
      );
    }

    // Process markdown table
    const headerRow = lines[0];
    const headerCells = headerRow.split('|')
      .filter(cell => cell.trim())
      .map(cell => cell.trim());
    
    // Skip the separator row and process data rows
    const dataRows = lines.slice(2).map(row => {
      return row.split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim());
    });
    
    return (
      <ScrollView horizontal style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableRow}>
            {headerCells.map((cell, i) => (
              <View key={i} style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderCellText}>{cell}</Text>
              </View>
            ))}
          </View>
          
          {/* Data rows */}
          {dataRows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              {row.map((cell, j) => (
                <View key={j} style={styles.tableCell}>
                  <Text style={styles.tableCellText}>{cell}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Early return after hooks are called
  if (!questionText) return null;

  // Render the content based on the processed parts
  return (
    <View style={styles.container}>
      {processedContent.map((part, index) => {
        switch (part.type) {
          case 'code-block':
            return (
              <View key={index} style={styles.codeBlockWrapper}>
                <View style={styles.codeControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setWordWrapEnabled(!wordWrapEnabled)}
                  >
                    <Text style={styles.controlButtonText}>
                      {wordWrapEnabled ? 'Wrap: ON' : 'Wrap: OFF'}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.zoomControls}>
                    <TouchableOpacity
                      style={styles.zoomButton}
                      onPress={() => setCodeZoomLevel(Math.max(0.6, codeZoomLevel - 0.2))}
                    >
                      <Text style={styles.zoomButtonText}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.zoomLevel}>{Math.round(codeZoomLevel * 100)}%</Text>
                    
                    <TouchableOpacity
                      style={styles.zoomButton}
                      onPress={() => setCodeZoomLevel(Math.min(2, codeZoomLevel + 0.2))}
                    >
                      <Text style={styles.zoomButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.codeBlock}>
                  <ScrollView 
                    horizontal={!wordWrapEnabled}
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={[
                      styles.codeBlockContent,
                      wordWrapEnabled && { flexShrink: 1 }
                    ]}
                  >
                    <View style={wordWrapEnabled && { width: '100%' }}>
                      {applySyntaxHighlighting(part.content, part.language)}
                    </View>
                  </ScrollView>
                </View>
                
                <Text style={styles.languageLabel}>
                  {part.language || 'code'}
                </Text>
              </View>
            );
          
          case 'inline-code':
            return (
              <Text key={index} style={styles.inlineCode} selectable>
                {part.content}
              </Text>
            );
          
          case 'table':
            return (
              <View key={index} style={styles.tableWrapper}>
                {renderTable(part.content)}
              </View>
            );
          
          case 'ascii-diagram':
            return (
              <ScrollView key={index} horizontal style={styles.asciiDiagramContainer}>
                <Text style={styles.asciiDiagramText} selectable>
                  {part.content}
                </Text>
              </ScrollView>
            );
          
          default:
            // Handle regular text (preserving newlines and formatting)
            return (
              <Text key={index} style={styles.paragraph} selectable>
                {part.content.split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < arr.length - 1 ? '\n' : ''}
                  </React.Fragment>
                ))}
              </Text>
            );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paragraph: {
    color: '#E2E2E2',
    fontSize: 16,             // Restored to original size
    lineHeight: 24,           // Restored to original size
    marginBottom: 12,         // Restored to original size
    flexWrap: 'wrap',
  },
  plainText: {
    color: '#E2E2E2',
    fontSize: 16,             // Restored to original size
    lineHeight: 24,           // Restored to original size
    flexWrap: 'wrap',
  },
  preformattedText: {
    color: '#E2E2E2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,             // Restored to original size
    marginVertical: 10,       // Restored to original size
    flexWrap: 'wrap',
  },
  codeBlockWrapper: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D3A',
    backgroundColor: '#1A1A28',
  },
  codeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#252532',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3A',
  },
  controlButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#333342',
  },
  controlButtonText: {
    color: '#BBBBCC',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333342',
    borderRadius: 4,
  },
  zoomButtonText: {
    color: '#BBBBCC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoomLevel: {
    color: '#BBBBCC',
    fontSize: 10,
    marginHorizontal: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeBlock: {
    backgroundColor: '#1E1E2E',
    padding: 8,
  },
  codeBlockContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingRight: 16,
  },
  codeText: {
    color: '#E2E2E2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 9,              // Keeping code font size small
    lineHeight: 14,
  },

  inlineCode: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,             // Restored to match text size
    color: '#E2E2E2',
  },
  // Table styles
  tableWrapper: {
    marginVertical: 10,       // Restored to original size
  },
  tableContainer: {
    maxHeight: 300,           // Restored to original size
  },
  table: {
    borderWidth: 1,
    borderColor: '#2D2D3A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3A',
  },
  tableHeaderCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,               // Restored to original size
    borderRightWidth: 1,
    borderRightColor: '#2D2D3A',
  },
  tableHeaderCellText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,             // Restored to original size
  },
  tableCell: {
    padding: 8,               // Restored to original size
    borderRightWidth: 1,
    borderRightColor: '#2D2D3A',
  },
  tableCellText: {
    color: '#E2E2E2',
    fontSize: 14,             // Restored to original size
  },
  // ASCII diagram styles
  asciiDiagramContainer: {
    backgroundColor: '#1E1E2E',
    borderRadius: 6,
    padding: 12,              // Restored to original size
    marginVertical: 10,       // Restored to original size
    borderWidth: 1,
    borderColor: '#2D2D3A',
  },
  asciiDiagramText: {
    color: '#E2E2E2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,             // Restored to original size
  },
});

export default FormattedQuestion;
