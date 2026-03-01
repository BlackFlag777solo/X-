import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Matrix rain effect component
const MatrixRain = () => {
  const columns = Math.floor(width / 20);
  const [drops, setDrops] = useState<number[]>(Array(columns).fill(1));

  useEffect(() => {
    const interval = setInterval(() => {
      setDrops((prev) =>
        prev.map((y, i) => (Math.random() > 0.975 ? 0 : y + 1))
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.matrixContainer}>
      {drops.map((y, i) => (
        <Text
          key={i}
          style={[
            styles.matrixChar,
            { left: i * 20, top: (y * 20) % height, opacity: Math.random() * 0.5 + 0.3 },
          ]}
        >
          {String.fromCharCode(0x30a0 + Math.random() * 96)}
        </Text>
      ))}
    </View>
  );
};

type TabType = 'home' | 'osint' | 'password' | 'website' | 'chat';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // OSINT State
  const [osintUsername, setOsintUsername] = useState('');
  const [osintResults, setOsintResults] = useState<any[]>([]);

  // Password State
  const [password, setPassword] = useState('');
  const [passwordResult, setPasswordResult] = useState<any>(null);

  // Website State
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteResult, setWebsiteResult] = useState<any>(null);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#00ff88', '#00ffff'],
  });

  // API Calls
  const scanOSINT = async () => {
    if (!osintUsername.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/osint/scan`, {
        username: osintUsername,
      });
      setOsintResults(response.data);
    } catch (error) {
      console.error('OSINT Error:', error);
    }
    setLoading(false);
  };

  const checkPassword = async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/password/check`, {
        password: password,
      });
      setPasswordResult(response.data);
    } catch (error) {
      console.error('Password Error:', error);
    }
    setLoading(false);
  };

  const analyzeWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/website/analyze`, {
        url: websiteUrl,
      });
      setWebsiteResult(response.data);
    } catch (error) {
      console.error('Website Error:', error);
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        session_id: sessionId,
        message: userMsg,
      });
      setChatHistory((prev) => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Error connecting to AI...' }]);
    }
    setLoading(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderHome = () => (
    <Animated.View style={[styles.homeContainer, { opacity: fadeAnim }]}>
      <MatrixRain />
      <View style={styles.logoContainer}>
        <Animated.Text style={[styles.logoText, { textShadowColor: glowColor }]}>
          X=π
        </Animated.Text>
        <Text style={styles.subtitleText}>by Carbi</Text>
        <Text style={styles.taglineText}>Cybersecurity Toolkit</Text>
      </View>

      <View style={styles.featuresGrid}>
        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('osint')}>
          <MaterialCommunityIcons name="account-search" size={40} color="#00ff88" />
          <Text style={styles.featureTitle}>OSINT</Text>
          <Text style={styles.featureDesc}>Username Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('password')}>
          <MaterialCommunityIcons name="shield-lock" size={40} color="#ff00ff" />
          <Text style={styles.featureTitle}>Password</Text>
          <Text style={styles.featureDesc}>Security Check</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('website')}>
          <MaterialCommunityIcons name="web" size={40} color="#00ffff" />
          <Text style={styles.featureTitle}>Website</Text>
          <Text style={styles.featureDesc}>Header Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('chat')}>
          <MaterialCommunityIcons name="robot" size={40} color="#ffff00" />
          <Text style={styles.featureTitle}>AI Chat</Text>
          <Text style={styles.featureDesc}>Security Expert</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🔒 100% Legal & Ethical Security Tools</Text>
        <Text style={styles.versionText}>v1.0.0 - Powered by AI</Text>
      </View>
    </Animated.View>
  );

  const renderOSINT = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OSINT Scanner</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="account-search" size={24} color="#00ff88" />
        <TextInput
          style={styles.input}
          placeholder="Enter username to search..."
          placeholderTextColor="#666"
          value={osintUsername}
          onChangeText={setOsintUsername}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.scanButton, loading && styles.buttonDisabled]}
        onPress={scanOSINT}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <FontAwesome5 name="search" size={18} color="#000" />
            <Text style={styles.scanButtonText}>SCAN PLATFORMS</Text>
          </>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {osintResults.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.platformName}>{result.platform}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: result.exists ? '#00ff88' : '#ff4444' },
                ]}
              >
                <Text style={styles.statusText}>
                  {result.exists ? 'FOUND' : 'NOT FOUND'}
                </Text>
              </View>
            </View>
            <Text style={styles.resultUrl} numberOfLines={1}>
              {result.url}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderPassword = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ff00ff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ff00ff' }]}>Password Checker</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.inputContainer, { borderColor: '#ff00ff' }]}>
        <MaterialCommunityIcons name="lock" size={24} color="#ff00ff" />
        <TextInput
          style={styles.input}
          placeholder="Enter password to check..."
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: '#ff00ff' }, loading && styles.buttonDisabled]}
        onPress={checkPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <MaterialCommunityIcons name="shield-check" size={18} color="#000" />
            <Text style={styles.scanButtonText}>CHECK SECURITY</Text>
          </>
        )}
      </TouchableOpacity>

      {passwordResult && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.resultCard, { borderColor: '#ff00ff' }]}>
            <Text style={styles.resultLabel}>Strength</Text>
            <Text
              style={[
                styles.strengthText,
                {
                  color:
                    passwordResult.strength === 'Strong'
                      ? '#00ff88'
                      : passwordResult.strength === 'Medium'
                      ? '#ffff00'
                      : '#ff4444',
                },
              ]}
            >
              {passwordResult.strength}
            </Text>

            <Text style={styles.resultLabel}>Data Breaches</Text>
            <View style={styles.breachContainer}>
              {passwordResult.is_pwned ? (
                <>
                  <MaterialCommunityIcons name="alert-circle" size={24} color="#ff4444" />
                  <Text style={styles.breachText}>
                    Found in {passwordResult.breach_count.toLocaleString()} breaches!
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#00ff88" />
                  <Text style={[styles.breachText, { color: '#00ff88' }]}>
                    Not found in any known breaches
                  </Text>
                </>
              )}
            </View>

            <Text style={styles.resultLabel}>Suggestions</Text>
            {passwordResult.suggestions.map((suggestion: string, index: number) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderWebsite = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#00ffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#00ffff' }]}>Website Analyzer</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.inputContainer, { borderColor: '#00ffff' }]}>
        <MaterialCommunityIcons name="web" size={24} color="#00ffff" />
        <TextInput
          style={styles.input}
          placeholder="Enter website URL..."
          placeholderTextColor="#666"
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: '#00ffff' }, loading && styles.buttonDisabled]}
        onPress={analyzeWebsite}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <MaterialCommunityIcons name="radar" size={18} color="#000" />
            <Text style={styles.scanButtonText}>ANALYZE HEADERS</Text>
          </>
        )}
      </TouchableOpacity>

      {websiteResult && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.resultCard, { borderColor: '#00ffff' }]}>
            <Text style={styles.resultLabel}>Security Score</Text>
            <Text style={styles.scoreText}>{websiteResult.overall_score}</Text>

            <Text style={styles.resultLabel}>Security Headers</Text>
            {websiteResult.headers.map((header: any, index: number) => (
              <View key={index} style={styles.headerRow}>
                <MaterialCommunityIcons
                  name={header.present ? 'check-circle' : 'close-circle'}
                  size={20}
                  color={header.present ? '#00ff88' : '#ff4444'}
                />
                <Text style={styles.headerName}>{header.header}</Text>
              </View>
            ))}

            {websiteResult.recommendations.length > 0 && (
              <>
                <Text style={[styles.resultLabel, { marginTop: 16 }]}>Recommendations</Text>
                {websiteResult.recommendations.map((rec: string, index: number) => (
                  <Text key={index} style={styles.suggestionText}>
                    • {rec}
                  </Text>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderChat = () => (
    <KeyboardAvoidingView
      style={styles.tabContent}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ffff00" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ffff00' }]}>AI Security Chat</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {chatHistory.length === 0 && (
          <View style={styles.welcomeChat}>
            <MaterialCommunityIcons name="robot" size={60} color="#ffff00" />
            <Text style={styles.welcomeText}>Welcome to X=π AI</Text>
            <Text style={styles.welcomeSubtext}>
              Ask me anything about cybersecurity, ethical hacking, password security, or privacy
              protection.
            </Text>
          </View>
        )}

        {chatHistory.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.chatBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.chatText}>{msg.content}</Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.chatBubble, styles.assistantBubble]}>
            <ActivityIndicator color="#ffff00" size="small" />
          </View>
        )}
      </ScrollView>

      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask about cybersecurity..."
          placeholderTextColor="#666"
          value={chatMessage}
          onChangeText={setChatMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={sendChat}
          disabled={loading}
        >
          <Ionicons name="send" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {activeTab === 'home' && renderHome()}
      {activeTab === 'osint' && renderOSINT()}
      {activeTab === 'password' && renderPassword()}
      {activeTab === 'website' && renderWebsite()}
      {activeTab === 'chat' && renderChat()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  matrixContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  matrixChar: {
    position: 'absolute',
    color: '#00ff8830',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  homeContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
  subtitleText: {
    fontSize: 24,
    color: '#ff00ff',
    fontStyle: 'italic',
    marginTop: 8,
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  taglineText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    letterSpacing: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  featureTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  featureDesc: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#00ff88',
    fontSize: 12,
  },
  versionText: {
    color: '#444',
    fontSize: 10,
    marginTop: 4,
  },
  tabContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#00ff88',
    fontSize: 22,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#00ff88',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
    marginLeft: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultUrl: {
    color: '#666',
    fontSize: 12,
  },
  resultLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  strengthText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  breachContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  breachText: {
    color: '#ff4444',
    fontSize: 16,
  },
  suggestionText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  headerName: {
    color: '#ccc',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 20,
  },
  welcomeChat: {
    alignItems: 'center',
    paddingTop: 60,
  },
  welcomeText: {
    color: '#ffff00',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  welcomeSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a3a2a',
    borderColor: '#00ff88',
    borderWidth: 1,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a2a',
    borderColor: '#ffff00',
    borderWidth: 1,
  },
  chatText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ffff00',
  },
  sendButton: {
    backgroundColor: '#ffff00',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
