// src/constants/testConstants.js
export const TEST_LENGTHS = [25, 50, 75, 100];

export const TEST_CATEGORIES = [
  { id: 'aplus', name: 'A+ Core 1 (1101)', emoji: '💻', color: '#6543CC' },
  { id: 'aplus2', name: 'A+ Core 2 (1102)', emoji: '🖥️', color: '#FF4C8B' },
  { id: 'nplus', name: 'Network+ (N10-009)', emoji: '📡', color: '#2ECC71' },
  { id: 'secplus', name: 'Security+ (SY0-701)', emoji: '🔐', color: '#3498DB' },
  { id: 'cysa', name: 'CySA+ (CS0-003)', emoji: '🕵️‍♂️', color: '#E67E22' },
  { id: 'penplus', name: 'PenTest+ (PT0-003)', emoji: '🐍', color: '#9B59B6' },
  { id: 'linuxplus', name: 'Linux+ (XK0-005)', emoji: '🐧', color: '#1ABC9C' },
  { id: 'caspplus', name: 'CASP+ (CAS-005)', emoji: '⚔️', color: '#E74C3C' },
  { id: 'cloudplus', name: 'Cloud+ (CV0-004)', emoji: '🌩️', color: '#3498DB' },
  { id: 'dataplus', name: 'Data+ (DA0-001)', emoji: '📋', color: '#1ABC9C' },
  { id: 'serverplus', name: 'Server+ (SK0-005)', emoji: '🧛‍♂️', color: '#9B59B6' },
  { id: 'cissp', name: 'CISSP', emoji: '👾', color: '#34495E' },
  { id: 'awscloud', name: 'AWS Cloud Practitioner', emoji: '🌥️', color: '#F39C12' },
];

export const DIFFICULTY_CATEGORIES = [
  { label: "Normal", color: "#fff9e6", textColor: "#4a4a4a" },
  { label: "Very Easy", color: "#adebad", textColor: "#0b3800" },
  { label: "Easy", color: "#87cefa", textColor: "#000000" },
  { label: "Moderate", color: "#ffc765", textColor: "#4a2700" },
  { label: "Intermediate", color: "#ff5959", textColor: "#ffffff" },
  { label: "Formidable", color: "#dc3545", textColor: "#ffffff" },
  { label: "Merciless", color: "#b108f6", textColor: "#ffffff" },
  { label: "Ruthless", color: "#4b0082", textColor: "#ffffff" },
  { label: "Relentless", color: "#370031", textColor: "#ffffff" },
  { label: "Nuclear", color: "#000000", textColor: "#00ffff" }
];

export const EXAM_MODE_INFO = 
  "Exam Mode simulates a real exam environment:\n\n" +
  "• No immediate feedback on answers\n" +
  "• See results only after completing the test\n\n" +
  "This is perfect for final exam preparation!";
