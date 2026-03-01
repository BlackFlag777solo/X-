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
  Clipboard,
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

type TabType = 'home' | 'osint' | 'password' | 'website' | 'chat' | 'intel' | 'defense';
type IntelSubTab = 'cve' | 'tech' | 'ddos';
type DefenseSubTab = 'ip' | 'firewall' | 'threats' | 'abuse';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [intelSubTab, setIntelSubTab] = useState<IntelSubTab>('cve');
  const [defenseSubTab, setDefenseSubTab] = useState<DefenseSubTab>('ip');
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

  // Defense State
  const [ipToCheck, setIpToCheck] = useState('');
  const [ipResult, setIpResult] = useState<any>(null);
  const [firewallIps, setFirewallIps] = useState('');
  const [firewallType, setFirewallType] = useState('iptables');
  const [firewallResult, setFirewallResult] = useState<any>(null);
  const [threatFeed, setThreatFeed] = useState<any>(null);
  const [abuseIp, setAbuseIp] = useState('');
  const [abuseType, setAbuseType] = useState('');
  const [abuseEvidence, setAbuseEvidence] = useState('');
  const [abuseResult, setAbuseResult] = useState<any>(null);

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

  // API Calls - Original
  const scanOSINT = async () => {
    if (!osintUsername.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/osint/scan`, { username: osintUsername });
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
      const response = await axios.post(`${API_URL}/api/password/check`, { password: password });
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
      const response = await axios.post(`${API_URL}/api/website/analyze`, { url: websiteUrl });
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
      const response = await axios.post(`${API_URL}/api/chat`, { session_id: sessionId, message: userMsg });
      setChatHistory((prev) => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
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
      const response = await axios.post(`${API_URL}/api/intel/cve`, { cve_id: cveId });
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
      const response = await axios.post(`${API_URL}/api/intel/techdetect`, { url: techUrl });
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
      const response = await axios.post(`${API_URL}/api/intel/ddos-analysis`, { url: ddosUrl });
      setDdosResult(response.data);
    } catch (error: any) {
      setDdosResult({ error: error.response?.data?.detail || 'Analysis failed' });
    }
    setLoading(false);
  };

  // Defense API Calls
  const checkIPReputation = async () => {
    if (!ipToCheck.trim()) return;
    setLoading(true);
    setIpResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/defense/ip-reputation`, { ip: ipToCheck });
      setIpResult(response.data);
    } catch (error: any) {
      setIpResult({ error: error.response?.data?.detail || 'Check failed' });
    }
    setLoading(false);
  };

  const generateFirewallRules = async () => {
    if (!firewallIps.trim()) return;
    setLoading(true);
    setFirewallResult(null);
    try {
      const ips = firewallIps.split(',').map(ip => ip.trim()).filter(ip => ip);
      const response = await axios.post(`${API_URL}/api/defense/firewall-rules`, { ips, rule_type: firewallType });
      setFirewallResult(response.data);
    } catch (error: any) {
      setFirewallResult({ error: error.response?.data?.detail || 'Generation failed' });
    }
    setLoading(false);
  };

  const loadThreatFeed = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/defense/threat-feed`);
      setThreatFeed(response.data);
    } catch (error) {
      console.error('Threat feed error:', error);
    }
    setLoading(false);
  };

  const generateAbuseReport = async () => {
    if (!abuseIp.trim() || !abuseType.trim()) return;
    setLoading(true);
    setAbuseResult(null);
    try {
      const evidence = abuseEvidence.split('\n').filter(e => e.trim());
      const response = await axios.post(`${API_URL}/api/defense/abuse-report`, {
        attacker_ip: abuseIp,
        attack_type: abuseType,
        evidence: evidence.length > 0 ? evidence : ['Attack detected'],
      });
      setAbuseResult(response.data);
    } catch (error: any) {
      setAbuseResult({ error: error.response?.data?.detail || 'Report generation failed' });
    }
    setLoading(false);
  };

  const renderHome = () => (
    <Animated.View style={[styles.homeContainer, { opacity: fadeAnim }]}>
      <MatrixRain />
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>X=pi</Text>
        <Text style={styles.subtitleText}>by Carbi</Text>
        <Text style={styles.taglineText}>Cybersecurity Toolkit v3.0</Text>
      </View>

      <ScrollView style={styles.homeScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('osint')}>
            <MaterialCommunityIcons name="account-search" size={32} color="#00ff88" />
            <Text style={styles.featureTitle}>OSINT</Text>
            <Text style={styles.featureDesc}>Username Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('password')}>
            <MaterialCommunityIcons name="shield-lock" size={32} color="#ff00ff" />
            <Text style={styles.featureTitle}>Password</Text>
            <Text style={styles.featureDesc}>Security Check</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('website')}>
            <MaterialCommunityIcons name="web" size={32} color="#00ffff" />
            <Text style={styles.featureTitle}>Website</Text>
            <Text style={styles.featureDesc}>Header Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('chat')}>
            <MaterialCommunityIcons name="robot" size={32} color="#ffff00" />
            <Text style={styles.featureTitle}>AI Chat</Text>
            <Text style={styles.featureDesc}>Security Expert</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.featureCardWide, { borderColor: '#ff6600' }]} onPress={() => setActiveTab('intel')}>
          <MaterialCommunityIcons name="shield-bug" size={36} color="#ff6600" />
          <View style={styles.wideCardText}>
            <Text style={styles.featureTitle}>Security Intel</Text>
            <Text style={styles.featureDesc}>CVE | Tech Detection | DDoS Analysis</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.featureCardWide, { borderColor: '#00ff00' }]} onPress={() => setActiveTab('defense')}>
          <MaterialCommunityIcons name="shield-check" size={36} color="#00ff00" />
          <View style={styles.wideCardText}>
            <Text style={styles.featureTitle}>Defense Center</Text>
            <Text style={styles.featureDesc}>IP Rep | Firewall | Threats | Reports</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.footerInline}>
          <Text style={styles.footerText}>100% Legal & Ethical Security Tools</Text>
          <Text style={styles.versionText}>v3.0.0 - Defense Center Added</Text>
        </View>
      </ScrollView>
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
        <TextInput style={styles.input} placeholder="Enter username..." placeholderTextColor="#666" value={osintUsername} onChangeText={setOsintUsername} autoCapitalize="none" />
      </View>

      <TouchableOpacity style={[styles.scanButton, loading && styles.buttonDisabled]} onPress={scanOSINT} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <><FontAwesome5 name="search" size={16} color="#000" /><Text style={styles.scanButtonText}>SCAN</Text></>}
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {osintResults.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.platformName}>{result.platform}</Text>
              <View style={[styles.statusBadge, { backgroundColor: result.exists ? '#00ff88' : '#ff4444' }]}>
                <Text style={styles.statusText}>{result.exists ? 'FOUND' : 'NOT FOUND'}</Text>
              </View>
            </View>
            <Text style={styles.resultUrl} numberOfLines={1}>{result.url}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderPassword = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}><Ionicons name="arrow-back" size={28} color="#ff00ff" /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ff00ff' }]}>Password Checker</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.inputContainer, { borderColor: '#ff00ff' }]}>
        <MaterialCommunityIcons name="lock" size={24} color="#ff00ff" />
        <TextInput style={styles.input} placeholder="Enter password..." placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff00ff' }, loading && styles.buttonDisabled]} onPress={checkPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="shield-check" size={16} color="#000" /><Text style={styles.scanButtonText}>CHECK</Text></>}
      </TouchableOpacity>

      {passwordResult && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.resultCard, { borderColor: '#ff00ff' }]}>
            <Text style={styles.resultLabel}>Strength</Text>
            <Text style={[styles.strengthText, { color: passwordResult.strength === 'Strong' ? '#00ff88' : passwordResult.strength === 'Medium' ? '#ffff00' : '#ff4444' }]}>{passwordResult.strength}</Text>
            <Text style={styles.resultLabel}>Data Breaches</Text>
            <View style={styles.breachContainer}>
              {passwordResult.is_pwned ? (
                <><MaterialCommunityIcons name="alert-circle" size={24} color="#ff4444" /><Text style={styles.breachText}>Found in {passwordResult.breach_count.toLocaleString()} breaches!</Text></>
              ) : (
                <><MaterialCommunityIcons name="check-circle" size={24} color="#00ff88" /><Text style={[styles.breachText, { color: '#00ff88' }]}>Not found in breaches</Text></>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderWebsite = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}><Ionicons name="arrow-back" size={28} color="#00ffff" /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#00ffff' }]}>Website Analyzer</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.inputContainer, { borderColor: '#00ffff' }]}>
        <MaterialCommunityIcons name="web" size={24} color="#00ffff" />
        <TextInput style={styles.input} placeholder="Enter website URL..." placeholderTextColor="#666" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" />
      </View>

      <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ffff' }, loading && styles.buttonDisabled]} onPress={analyzeWebsite} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="radar" size={16} color="#000" /><Text style={styles.scanButtonText}>ANALYZE</Text></>}
      </TouchableOpacity>

      {websiteResult && (
        <ScrollView style={styles.resultsContainer}>
          <View style={[styles.resultCard, { borderColor: '#00ffff' }]}>
            <Text style={styles.resultLabel}>Security Score</Text>
            <Text style={styles.scoreText}>{websiteResult.overall_score}</Text>
            <Text style={styles.resultLabel}>Headers</Text>
            {websiteResult.headers.map((h: any, i: number) => (
              <View key={i} style={styles.headerRow}>
                <MaterialCommunityIcons name={h.present ? 'check-circle' : 'close-circle'} size={18} color={h.present ? '#00ff88' : '#ff4444'} />
                <Text style={styles.headerName}>{h.header}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderChat = () => (
    <KeyboardAvoidingView style={styles.tabContent} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}><Ionicons name="arrow-back" size={28} color="#ffff00" /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ffff00' }]}>AI Security Chat</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.chatContainer}>
        {chatHistory.length === 0 && (
          <View style={styles.welcomeChat}>
            <MaterialCommunityIcons name="robot" size={50} color="#ffff00" />
            <Text style={styles.welcomeText}>X=pi AI Assistant</Text>
            <Text style={styles.welcomeSubtext}>Ask about cybersecurity</Text>
          </View>
        )}
        {chatHistory.map((msg, i) => (
          <View key={i} style={[styles.chatBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={styles.chatText}>{msg.content}</Text>
          </View>
        ))}
        {loading && <View style={[styles.chatBubble, styles.assistantBubble]}><ActivityIndicator color="#ffff00" size="small" /></View>}
      </ScrollView>

      <View style={styles.chatInputContainer}>
        <TextInput style={styles.chatInput} placeholder="Ask..." placeholderTextColor="#666" value={chatMessage} onChangeText={setChatMessage} multiline />
        <TouchableOpacity style={[styles.sendButton, loading && styles.buttonDisabled]} onPress={sendChat} disabled={loading}>
          <Ionicons name="send" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderIntel = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}><Ionicons name="arrow-back" size={28} color="#ff6600" /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ff6600' }]}>Security Intel</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.subTabContainer}>
        {(['cve', 'tech', 'ddos'] as IntelSubTab[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.subTab, intelSubTab === tab && { backgroundColor: '#ff6600' }]} onPress={() => setIntelSubTab(tab)}>
            <Text style={[styles.subTabText, intelSubTab === tab && { color: '#000' }]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.resultsContainer}>
        {intelSubTab === 'cve' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff6600' }]}>
              <MaterialCommunityIcons name="bug" size={24} color="#ff6600" />
              <TextInput style={styles.input} placeholder="CVE-2021-44228" placeholderTextColor="#666" value={cveId} onChangeText={setCveId} autoCapitalize="characters" />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]} onPress={searchCVE} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>SEARCH CVE</Text>}
            </TouchableOpacity>
            {cveResult && !cveResult.error && (
              <View style={[styles.resultCard, { borderColor: '#ff6600' }]}>
                <View style={styles.cveHeader}>
                  <Text style={styles.cveId}>{cveResult.cve_id}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: cveResult.severity === 'CRITICAL' ? '#ff0000' : cveResult.severity === 'HIGH' ? '#ff6600' : '#ffff00' }]}>
                    <Text style={styles.severityText}>{cveResult.severity}</Text>
                  </View>
                </View>
                {cveResult.cvss_score && <Text style={styles.cvssScore}>CVSS: {cveResult.cvss_score}</Text>}
                <Text style={styles.cveDescription}>{cveResult.description}</Text>
              </View>
            )}
          </>
        )}

        {intelSubTab === 'tech' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff6600' }]}>
              <MaterialCommunityIcons name="web" size={24} color="#ff6600" />
              <TextInput style={styles.input} placeholder="https://example.com" placeholderTextColor="#666" value={techUrl} onChangeText={setTechUrl} autoCapitalize="none" />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]} onPress={detectTech} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>DETECT TECH</Text>}
            </TouchableOpacity>
            {techResult && !techResult.error && (
              <View style={[styles.resultCard, { borderColor: '#ff6600' }]}>
                {techResult.server && <Text style={styles.techItem}>Server: {techResult.server}</Text>}
                {techResult.framework && <Text style={styles.techItem}>Framework: {techResult.framework}</Text>}
                {techResult.technologies.map((t: any, i: number) => (
                  <View key={i} style={styles.techRow}><Text style={styles.techName}>{t.name}</Text><Text style={[styles.techConf, { color: t.confidence === 'high' ? '#00ff88' : '#ffff00' }]}>{t.confidence}</Text></View>
                ))}
              </View>
            )}
          </>
        )}

        {intelSubTab === 'ddos' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff6600' }]}>
              <MaterialCommunityIcons name="shield-alert" size={24} color="#ff6600" />
              <TextInput style={styles.input} placeholder="https://your-site.com" placeholderTextColor="#666" value={ddosUrl} onChangeText={setDdosUrl} autoCapitalize="none" />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]} onPress={analyzeDDoS} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>ANALYZE</Text>}
            </TouchableOpacity>
            {ddosResult && !ddosResult.error && (
              <View style={[styles.resultCard, { borderColor: '#ff6600' }]}>
                <View style={styles.ddosHeader}>
                  <Text style={styles.resultLabel}>Risk Level</Text>
                  <View style={[styles.riskBadge, { backgroundColor: ddosResult.overall_risk === 'CRITICAL' ? '#ff0000' : ddosResult.overall_risk === 'HIGH' ? '#ff6600' : '#00ff88' }]}>
                    <Text style={styles.riskText}>{ddosResult.overall_risk}</Text>
                  </View>
                </View>
                {ddosResult.cdn_detected && <Text style={styles.cdnText}>Protected: {ddosResult.cdn_detected}</Text>}
                {ddosResult.vulnerabilities.map((v: any, i: number) => (
                  <View key={i} style={styles.vulnItem}><Text style={styles.vulnType}>{v.type}</Text><Text style={styles.vulnMit}>{v.mitigation}</Text></View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderDefense = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}><Ionicons name="arrow-back" size={28} color="#00ff00" /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#00ff00' }]}>Defense Center</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.subTabContainer}>
        {(['ip', 'firewall', 'threats', 'abuse'] as DefenseSubTab[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.subTab, defenseSubTab === tab && { backgroundColor: '#00ff00' }]} onPress={() => { setDefenseSubTab(tab); if (tab === 'threats') loadThreatFeed(); }}>
            <Text style={[styles.subTabText, defenseSubTab === tab && { color: '#000' }]}>{tab === 'ip' ? 'IP' : tab === 'firewall' ? 'FW' : tab === 'threats' ? 'TI' : 'RPT'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.resultsContainer}>
        {defenseSubTab === 'ip' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#00ff00' }]}>
              <MaterialCommunityIcons name="ip-network" size={24} color="#00ff00" />
              <TextInput style={styles.input} placeholder="Enter IP address..." placeholderTextColor="#666" value={ipToCheck} onChangeText={setIpToCheck} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ff00' }, loading && styles.buttonDisabled]} onPress={checkIPReputation} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>CHECK REPUTATION</Text>}
            </TouchableOpacity>
            {ipResult && !ipResult.error && (
              <View style={[styles.resultCard, { borderColor: ipResult.is_malicious ? '#ff0000' : '#00ff00' }]}>
                <View style={styles.ipHeader}>
                  <Text style={styles.ipAddress}>{ipResult.ip}</Text>
                  <View style={[styles.maliciousBadge, { backgroundColor: ipResult.is_malicious ? '#ff0000' : '#00ff00' }]}>
                    <Text style={styles.maliciousText}>{ipResult.is_malicious ? 'MALICIOUS' : 'SAFE'}</Text>
                  </View>
                </View>
                <Text style={styles.abuseScore}>Abuse Score: {ipResult.abuse_score}/100</Text>
                {ipResult.country && <Text style={styles.ipInfo}>Country: {ipResult.country}</Text>}
                {ipResult.isp && <Text style={styles.ipInfo}>ISP: {ipResult.isp}</Text>}
                {ipResult.threat_types.length > 0 && (
                  <View style={styles.threatTypes}>
                    <Text style={styles.resultLabel}>Threats:</Text>
                    {ipResult.threat_types.map((t: string, i: number) => <Text key={i} style={styles.threatType}>- {t}</Text>)}
                  </View>
                )}
                <Text style={[styles.resultLabel, { marginTop: 10 }]}>Recommendations:</Text>
                {ipResult.recommendations.slice(0, 3).map((r: string, i: number) => <Text key={i} style={styles.recommendation}>- {r}</Text>)}
              </View>
            )}
          </>
        )}

        {defenseSubTab === 'firewall' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#00ff00' }]}>
              <MaterialCommunityIcons name="wall-fire" size={24} color="#00ff00" />
              <TextInput style={styles.input} placeholder="IPs (comma separated)" placeholderTextColor="#666" value={firewallIps} onChangeText={setFirewallIps} />
            </View>
            <View style={styles.fwTypeContainer}>
              {['iptables', 'ufw', 'windows', 'pf'].map((type) => (
                <TouchableOpacity key={type} style={[styles.fwTypeBtn, firewallType === type && styles.fwTypeBtnActive]} onPress={() => setFirewallType(type)}>
                  <Text style={[styles.fwTypeText, firewallType === type && styles.fwTypeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ff00' }, loading && styles.buttonDisabled]} onPress={generateFirewallRules} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>GENERATE RULES</Text>}
            </TouchableOpacity>
            {firewallResult && !firewallResult.error && (
              <View style={[styles.resultCard, { borderColor: '#00ff00' }]}>
                <Text style={styles.resultLabel}>Generated {firewallResult.rules.length} rules for {firewallResult.total_ips} IPs</Text>
                {firewallResult.rules.map((r: any, i: number) => (
                  <View key={i} style={styles.ruleItem}>
                    <Text style={styles.ruleCode}>{r.rule}</Text>
                    <Text style={styles.ruleDesc}>{r.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {defenseSubTab === 'threats' && (
          <>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ff00' }, loading && styles.buttonDisabled]} onPress={loadThreatFeed} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>LOAD THREAT FEED</Text>}
            </TouchableOpacity>
            {threatFeed && (
              <View style={[styles.resultCard, { borderColor: '#00ff00' }]}>
                <Text style={styles.resultLabel}>Active Threats: {threatFeed.total_threats}</Text>
                {threatFeed.threats.map((t: any, i: number) => (
                  <View key={i} style={styles.threatItem}>
                    <View style={styles.threatHeader}>
                      <Text style={styles.threatName}>{t.name}</Text>
                      <View style={[styles.threatSeverity, { backgroundColor: t.severity === 'CRITICAL' ? '#ff0000' : t.severity === 'HIGH' ? '#ff6600' : '#ffff00' }]}>
                        <Text style={styles.threatSeverityText}>{t.severity}</Text>
                      </View>
                    </View>
                    <Text style={styles.threatDesc}>{t.description}</Text>
                    <Text style={styles.threatIndicators}>Indicators: {t.indicators.join(', ')}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {defenseSubTab === 'abuse' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#00ff00' }]}>
              <MaterialCommunityIcons name="ip-network" size={24} color="#00ff00" />
              <TextInput style={styles.input} placeholder="Attacker IP" placeholderTextColor="#666" value={abuseIp} onChangeText={setAbuseIp} />
            </View>
            <View style={[styles.inputContainer, { borderColor: '#00ff00' }]}>
              <MaterialCommunityIcons name="alert" size={24} color="#00ff00" />
              <TextInput style={styles.input} placeholder="Attack type (e.g., DDoS, Brute Force)" placeholderTextColor="#666" value={abuseType} onChangeText={setAbuseType} />
            </View>
            <View style={[styles.inputContainer, { borderColor: '#00ff00', minHeight: 80 }]}>
              <TextInput style={[styles.input, { textAlignVertical: 'top' }]} placeholder="Evidence (one per line)" placeholderTextColor="#666" value={abuseEvidence} onChangeText={setAbuseEvidence} multiline numberOfLines={3} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ff00' }, loading && styles.buttonDisabled]} onPress={generateAbuseReport} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>GENERATE REPORT</Text>}
            </TouchableOpacity>
            {abuseResult && !abuseResult.error && (
              <View style={[styles.resultCard, { borderColor: '#00ff00' }]}>
                <Text style={styles.resultLabel}>Report Generated</Text>
                <Text style={styles.abuseEmail}>CERT: {abuseResult.cert_email}</Text>
                {abuseResult.isp_email && <Text style={styles.abuseEmail}>ISP: {abuseResult.isp_email}</Text>}
                <Text style={styles.abuseReport}>{abuseResult.report_text}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
      {activeTab === 'defense' && renderDefense()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  matrixContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  matrixChar: { position: 'absolute', color: '#00ff8830', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  homeContainer: { flex: 1, paddingTop: 45, paddingHorizontal: 16 },
  homeScroll: { flex: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 56, fontWeight: 'bold', color: '#00ff88', textShadowColor: '#00ff88', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  subtitleText: { fontSize: 20, color: '#ff00ff', fontStyle: 'italic', textShadowColor: '#ff00ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  taglineText: { fontSize: 12, color: '#666', marginTop: 2, letterSpacing: 2 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  featureCardWide: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, gap: 14 },
  wideCardText: { flex: 1 },
  featureTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginTop: 6 },
  featureDesc: { color: '#666', fontSize: 10, marginTop: 2 },
  footerInline: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: '#00ff88', fontSize: 10 },
  versionText: { color: '#444', fontSize: 9, marginTop: 2 },
  tabContent: { flex: 1, paddingTop: 45, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { color: '#00ff88', fontSize: 18, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#00ff88', marginBottom: 10 },
  input: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 10, marginLeft: 8 },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00ff88', paddingVertical: 12, borderRadius: 10, marginBottom: 14, gap: 8 },
  buttonDisabled: { opacity: 0.6 },
  scanButtonText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  resultsContainer: { flex: 1 },
  resultCard: { backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#00ff88' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  platformName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  resultUrl: { color: '#666', fontSize: 10 },
  resultLabel: { color: '#888', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  strengthText: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  breachContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  breachText: { color: '#ff4444', fontSize: 13 },
  scoreText: { fontSize: 20, fontWeight: 'bold', color: '#00ffff', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  headerName: { color: '#ccc', fontSize: 12 },
  chatContainer: { flex: 1 },
  welcomeChat: { alignItems: 'center', paddingTop: 40 },
  welcomeText: { color: '#ffff00', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  welcomeSubtext: { color: '#888', fontSize: 12, marginTop: 4 },
  chatBubble: { maxWidth: '85%', padding: 10, borderRadius: 12, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1a3a2a', borderColor: '#00ff88', borderWidth: 1 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#1a1a2a', borderColor: '#ffff00', borderWidth: 1 },
  chatText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  chatInputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#222' },
  chatInput: { flex: 1, backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13, maxHeight: 80, borderWidth: 1, borderColor: '#ffff00' },
  sendButton: { backgroundColor: '#ffff00', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  subTabContainer: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#111', borderRadius: 8, padding: 3 },
  subTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  subTabText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  cveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cveId: { color: '#ff6600', fontSize: 16, fontWeight: 'bold' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  severityText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cvssScore: { color: '#ff6600', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  cveDescription: { color: '#ccc', fontSize: 12, lineHeight: 18 },
  techItem: { color: '#fff', fontSize: 13, marginBottom: 4 },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  techName: { color: '#fff', fontSize: 13 },
  techConf: { fontSize: 10, fontWeight: 'bold' },
  ddosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  riskText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  cdnText: { color: '#00ff88', fontSize: 12, marginBottom: 8 },
  vulnItem: { backgroundColor: '#1a1a1a', padding: 8, borderRadius: 6, marginBottom: 6 },
  vulnType: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  vulnMit: { color: '#00ff88', fontSize: 10, marginTop: 2 },
  ipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ipAddress: { color: '#00ff00', fontSize: 16, fontWeight: 'bold' },
  maliciousBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  maliciousText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  abuseScore: { color: '#ffff00', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  ipInfo: { color: '#888', fontSize: 12, marginBottom: 2 },
  threatTypes: { marginTop: 8 },
  threatType: { color: '#ff4444', fontSize: 12 },
  recommendation: { color: '#00ff88', fontSize: 11, marginBottom: 2 },
  fwTypeContainer: { flexDirection: 'row', marginBottom: 10, gap: 6 },
  fwTypeBtn: { flex: 1, backgroundColor: '#222', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  fwTypeBtnActive: { backgroundColor: '#00ff00' },
  fwTypeText: { color: '#888', fontSize: 11, fontWeight: 'bold' },
  fwTypeTextActive: { color: '#000' },
  ruleItem: { backgroundColor: '#1a1a1a', padding: 8, borderRadius: 6, marginBottom: 6 },
  ruleCode: { color: '#00ff00', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  ruleDesc: { color: '#888', fontSize: 10, marginTop: 2 },
  threatItem: { backgroundColor: '#1a1a1a', padding: 10, borderRadius: 6, marginBottom: 8 },
  threatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  threatName: { color: '#fff', fontSize: 13, fontWeight: 'bold', flex: 1 },
  threatSeverity: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  threatSeverityText: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  threatDesc: { color: '#ccc', fontSize: 11, marginBottom: 4 },
  threatIndicators: { color: '#666', fontSize: 10 },
  abuseEmail: { color: '#00ff00', fontSize: 12, marginBottom: 4 },
  abuseReport: { color: '#ccc', fontSize: 11, lineHeight: 16, marginTop: 8 },
});
