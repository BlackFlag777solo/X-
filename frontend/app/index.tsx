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

type TabType = 'home' | 'osint' | 'password' | 'website' | 'chat' | 'intel';
type IntelSubTab = 'cve' | 'tech' | 'ddos' | 'report';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [intelSubTab, setIntelSubTab] = useState<IntelSubTab>('cve');
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

  // Intel State
  const [cveId, setCveId] = useState('');
  const [cveResult, setCveResult] = useState<any>(null);
  const [techUrl, setTechUrl] = useState('');
  const [techResult, setTechResult] = useState<any>(null);
  const [ddosUrl, setDdosUrl] = useState('');
  const [ddosResult, setDdosResult] = useState<any>(null);

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

  // Intel API Calls
  const searchCVE = async () => {
    if (!cveId.trim()) return;
    setLoading(true);
    setCveResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/intel/cve`, {
        cve_id: cveId,
      });
      setCveResult(response.data);
    } catch (error: any) {
      setCveResult({ error: error.response?.data?.detail || 'CVE not found' });
    }
    setLoading(false);
  };

  const detectTech = async () => {
    if (!techUrl.trim()) return;
    setLoading(true);
    setTechResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/intel/techdetect`, {
        url: techUrl,
      });
      setTechResult(response.data);
    } catch (error: any) {
      setTechResult({ error: error.response?.data?.detail || 'Analysis failed' });
    }
    setLoading(false);
  };

  const analyzeDDoS = async () => {
    if (!ddosUrl.trim()) return;
    setLoading(true);
    setDdosResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/intel/ddos-analysis`, {
        url: ddosUrl,
      });
      setDdosResult(response.data);
    } catch (error: any) {
      setDdosResult({ error: error.response?.data?.detail || 'Analysis failed' });
    }
    setLoading(false);
  };

  const renderHome = () => (
    <Animated.View style={[styles.homeContainer, { opacity: fadeAnim }]}>
      <MatrixRain />
      <View style={styles.logoContainer}>
        <Animated.Text style={[styles.logoText, { textShadowColor: glowColor }]}>
          X=pi
        </Animated.Text>
        <Text style={styles.subtitleText}>by Carbi</Text>
        <Text style={styles.taglineText}>Cybersecurity Toolkit v2.0</Text>
      </View>

      <View style={styles.featuresGrid}>
        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('osint')}>
          <MaterialCommunityIcons name="account-search" size={36} color="#00ff88" />
          <Text style={styles.featureTitle}>OSINT</Text>
          <Text style={styles.featureDesc}>Username Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('password')}>
          <MaterialCommunityIcons name="shield-lock" size={36} color="#ff00ff" />
          <Text style={styles.featureTitle}>Password</Text>
          <Text style={styles.featureDesc}>Security Check</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('website')}>
          <MaterialCommunityIcons name="web" size={36} color="#00ffff" />
          <Text style={styles.featureTitle}>Website</Text>
          <Text style={styles.featureDesc}>Header Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('chat')}>
          <MaterialCommunityIcons name="robot" size={36} color="#ffff00" />
          <Text style={styles.featureTitle}>AI Chat</Text>
          <Text style={styles.featureDesc}>Security Expert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.featureCard, styles.featureCardLarge]} onPress={() => setActiveTab('intel')}>
          <MaterialCommunityIcons name="shield-bug" size={40} color="#ff6600" />
          <Text style={styles.featureTitle}>Security Intel</Text>
          <Text style={styles.featureDesc}>CVE | Tech | DDoS Defense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>100% Legal & Ethical Security Tools</Text>
        <Text style={styles.versionText}>v2.0.0 - Security Intelligence Center</Text>
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
                - {suggestion}
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
                    - {rec}
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
            <Text style={styles.welcomeText}>Welcome to X=pi AI</Text>
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

  const renderIntel = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ff6600" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ff6600' }]}>Security Intel</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Sub-tabs */}
      <View style={styles.subTabContainer}>
        <TouchableOpacity
          style={[styles.subTab, intelSubTab === 'cve' && styles.subTabActive]}
          onPress={() => setIntelSubTab('cve')}
        >
          <Text style={[styles.subTabText, intelSubTab === 'cve' && styles.subTabTextActive]}>CVE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, intelSubTab === 'tech' && styles.subTabActive]}
          onPress={() => setIntelSubTab('tech')}
        >
          <Text style={[styles.subTabText, intelSubTab === 'tech' && styles.subTabTextActive]}>Tech</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, intelSubTab === 'ddos' && styles.subTabActive]}
          onPress={() => setIntelSubTab('ddos')}
        >
          <Text style={[styles.subTabText, intelSubTab === 'ddos' && styles.subTabTextActive]}>DDoS</Text>
        </TouchableOpacity>
      </View>

      {/* CVE Search */}
      {intelSubTab === 'cve' && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.inputContainer, { borderColor: '#ff6600' }]}>
            <MaterialCommunityIcons name="bug" size={24} color="#ff6600" />
            <TextInput
              style={styles.input}
              placeholder="Enter CVE ID (e.g., CVE-2021-44228)"
              placeholderTextColor="#666"
              value={cveId}
              onChangeText={setCveId}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]}
            onPress={searchCVE}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="magnify" size={18} color="#000" />
                <Text style={styles.scanButtonText}>SEARCH CVE</Text>
              </>
            )}
          </TouchableOpacity>

          {cveResult && !cveResult.error && (
            <View style={[styles.resultCard, { borderColor: '#ff6600' }]}>
              <View style={styles.cveHeader}>
                <Text style={styles.cveId}>{cveResult.cve_id}</Text>
                <View style={[styles.severityBadge, {
                  backgroundColor: 
                    cveResult.severity === 'CRITICAL' ? '#ff0000' :
                    cveResult.severity === 'HIGH' ? '#ff6600' :
                    cveResult.severity === 'MEDIUM' ? '#ffff00' : '#00ff88'
                }]}>
                  <Text style={styles.severityText}>{cveResult.severity}</Text>
                </View>
              </View>
              
              {cveResult.cvss_score && (
                <Text style={styles.cvssScore}>CVSS: {cveResult.cvss_score}</Text>
              )}
              
              <Text style={styles.resultLabel}>Description</Text>
              <Text style={styles.cveDescription}>{cveResult.description}</Text>
              
              {cveResult.affected_products.length > 0 && (
                <>
                  <Text style={styles.resultLabel}>Affected Products</Text>
                  {cveResult.affected_products.slice(0, 5).map((product: string, i: number) => (
                    <Text key={i} style={styles.affectedProduct}>- {product}</Text>
                  ))}
                </>
              )}

              {cveResult.exploits_available && (
                <View style={styles.exploitWarning}>
                  <MaterialCommunityIcons name="alert" size={20} color="#ff0000" />
                  <Text style={styles.exploitText}>Exploits Available!</Text>
                </View>
              )}
            </View>
          )}

          {cveResult?.error && (
            <View style={[styles.resultCard, { borderColor: '#ff4444' }]}>
              <Text style={{ color: '#ff4444' }}>{cveResult.error}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Tech Detection */}
      {intelSubTab === 'tech' && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.inputContainer, { borderColor: '#ff6600' }]}>
            <MaterialCommunityIcons name="web" size={24} color="#ff6600" />
            <TextInput
              style={styles.input}
              placeholder="Enter website URL..."
              placeholderTextColor="#666"
              value={techUrl}
              onChangeText={setTechUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]}
            onPress={detectTech}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="magnify-scan" size={18} color="#000" />
                <Text style={styles.scanButtonText}>DETECT TECHNOLOGIES</Text>
              </>
            )}
          </TouchableOpacity>

          {techResult && !techResult.error && (
            <View style={[styles.resultCard, { borderColor: '#ff6600' }]}>
              <Text style={styles.resultLabel}>Detected Technologies</Text>
              
              {techResult.server && (
                <View style={styles.techRow}>
                  <MaterialCommunityIcons name="server" size={20} color="#00ffff" />
                  <Text style={styles.techName}>Server: {techResult.server}</Text>
                </View>
              )}
              
              {techResult.cms && (
                <View style={styles.techRow}>
                  <MaterialCommunityIcons name="application" size={20} color="#ff00ff" />
                  <Text style={styles.techName}>CMS: {techResult.cms}</Text>
                </View>
              )}
              
              {techResult.framework && (
                <View style={styles.techRow}>
                  <MaterialCommunityIcons name="code-braces" size={20} color="#ffff00" />
                  <Text style={styles.techName}>Framework: {techResult.framework}</Text>
                </View>
              )}

              {techResult.technologies.map((tech: any, i: number) => (
                <View key={i} style={styles.techRow}>
                  <MaterialCommunityIcons 
                    name={tech.category === 'CDN' ? 'cloud' : tech.category === 'Cloud' ? 'aws' : 'code-tags'} 
                    size={20} 
                    color="#00ff88" 
                  />
                  <Text style={styles.techName}>{tech.name}</Text>
                  <View style={[styles.confidenceBadge, {
                    backgroundColor: tech.confidence === 'high' ? '#00ff88' : tech.confidence === 'medium' ? '#ffff00' : '#666'
                  }]}>
                    <Text style={styles.confidenceText}>{tech.confidence}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* DDoS Defense Analysis */}
      {intelSubTab === 'ddos' && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.inputContainer, { borderColor: '#ff6600' }]}>
            <MaterialCommunityIcons name="shield-alert" size={24} color="#ff6600" />
            <TextInput
              style={styles.input}
              placeholder="Enter your website URL..."
              placeholderTextColor="#666"
              value={ddosUrl}
              onChangeText={setDdosUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]}
            onPress={analyzeDDoS}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="shield-search" size={18} color="#000" />
                <Text style={styles.scanButtonText}>ANALYZE DEFENSE</Text>
              </>
            )}
          </TouchableOpacity>

          {ddosResult && !ddosResult.error && (
            <View style={[styles.resultCard, { borderColor: '#ff6600' }]}>
              <View style={styles.ddosHeader}>
                <Text style={styles.resultLabel}>Overall Risk</Text>
                <View style={[styles.riskBadge, {
                  backgroundColor: 
                    ddosResult.overall_risk === 'CRITICAL' ? '#ff0000' :
                    ddosResult.overall_risk === 'HIGH' ? '#ff6600' :
                    ddosResult.overall_risk === 'MEDIUM' ? '#ffff00' : '#00ff88'
                }]}>
                  <Text style={styles.riskText}>{ddosResult.overall_risk}</Text>
                </View>
              </View>

              {ddosResult.cdn_detected && (
                <View style={styles.cdnBadge}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#00ff88" />
                  <Text style={styles.cdnText}>Protected by {ddosResult.cdn_detected}</Text>
                </View>
              )}

              <Text style={[styles.resultLabel, { marginTop: 16 }]}>Vulnerabilities</Text>
              {ddosResult.vulnerabilities.map((vuln: any, i: number) => (
                <View key={i} style={styles.vulnCard}>
                  <View style={styles.vulnHeader}>
                    <Text style={styles.vulnType}>{vuln.type}</Text>
                    <View style={[styles.vulnRiskBadge, {
                      backgroundColor: vuln.risk_level === 'HIGH' ? '#ff4444' : vuln.risk_level === 'MEDIUM' ? '#ffff00' : '#00ff88'
                    }]}>
                      <Text style={styles.vulnRiskText}>{vuln.risk_level}</Text>
                    </View>
                  </View>
                  <Text style={styles.vulnDesc}>{vuln.description}</Text>
                  <Text style={styles.vulnMitigation}>Fix: {vuln.mitigation}</Text>
                </View>
              ))}

              <Text style={[styles.resultLabel, { marginTop: 16 }]}>Recommendations</Text>
              {ddosResult.recommendations.map((rec: string, i: number) => (
                <Text key={i} style={styles.suggestionText}>- {rec}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {activeTab === 'home' && renderHome()}
      {activeTab === 'osint' && renderOSINT()}
      {activeTab === 'password' && renderPassword()}
      {activeTab === 'website' && renderWebsite()}
      {activeTab === 'chat' && renderChat()}
      {activeTab === 'intel' && renderIntel()}
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
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
  subtitleText: {
    fontSize: 22,
    color: '#ff00ff',
    fontStyle: 'italic',
    marginTop: 4,
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  taglineText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  featureCardLarge: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    gap: 16,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  featureDesc: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#00ff88',
    fontSize: 11,
  },
  versionText: {
    color: '#444',
    fontSize: 10,
    marginTop: 2,
  },
  tabContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#00ff88',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#00ff88',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
    marginLeft: 10,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  resultUrl: {
    color: '#666',
    fontSize: 11,
  },
  resultLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  strengthText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  breachContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  breachText: {
    color: '#ff4444',
    fontSize: 14,
  },
  suggestionText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  headerName: {
    color: '#ccc',
    fontSize: 13,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 16,
  },
  welcomeChat: {
    alignItems: 'center',
    paddingTop: 50,
  },
  welcomeText: {
    color: '#ffff00',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  welcomeSubtext: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
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
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: '#ffff00',
  },
  sendButton: {
    backgroundColor: '#ffff00',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  // Intel styles
  subTabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 4,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabActive: {
    backgroundColor: '#ff6600',
  },
  subTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subTabTextActive: {
    color: '#000',
  },
  cveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cveId: {
    color: '#ff6600',
    fontSize: 18,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cvssScore: {
    color: '#ff6600',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cveDescription: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  affectedProduct: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  exploitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#330000',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  exploitText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  techName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ddosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  riskText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cdnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003300',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  cdnText: {
    color: '#00ff88',
    fontSize: 14,
  },
  vulnCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  vulnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vulnType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vulnRiskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vulnRiskText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vulnDesc: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  vulnMitigation: {
    color: '#00ff88',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
