// src/components/FormattedQuestion.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

/**
 * FormattedQuestion component handles rich text formatting for questions in React Native
 * Supports Markdown-like syntax: code blocks, inline code, tables, and ASCII diagrams
 * Adapted from web version but optimized for mobile
 * 
 * @param {string} questionText - The text of the question to format
 * @returns {JSX.Element} - Formatted question component
 */
const FormattedQuestion = ({ questionText }) => {
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
              <View key={index} style={styles.codeBlock}>
                <ScrollView horizontal={true}>
                  <Text style={styles.codeText}>
                    {part.content}
                  </Text>
                </ScrollView>
              </View>
            );
          
          case 'inline-code':
            return (
              <Text key={index} style={styles.inlineCode}>
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
                <Text style={styles.asciiDiagramText}>
                  {part.content}
                </Text>
              </ScrollView>
            );
          
          default:
            // Handle regular text (preserving newlines and formatting)
            return (
              <Text key={index} style={styles.paragraph}>
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
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  plainText: {
    color: '#E2E2E2',
    fontSize: 16,
    lineHeight: 24,
  },
  preformattedText: {
    color: '#E2E2E2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    marginVertical: 10,
  },
  codeBlock: {
    backgroundColor: '#1E1E2E',
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#2D2D3A',
  },
  codeText: {
    color: '#E2E2E2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  inlineCode: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#E2E2E2',
  },
  // Table styles
  tableWrapper: {
    marginVertical: 10,
  },
  tableContainer: {
    maxHeight: 300, // Limit maximum height
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
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#2D2D3A',
  },
  tableHeaderCellText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#2D2D3A',
  },
  tableCellText: {
    color: '#E2E2E2',
    fontSize: 14,
  },
  // ASCII diagram styles
  asciiDiagramContainer: {
    backgroundColor: '#1E1E2E',
    borderRadius: 6,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#2D2D3A',
  },
  asciiDiagramText: {
    color: '#E2E2E2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
});

export default FormattedQuestion;
