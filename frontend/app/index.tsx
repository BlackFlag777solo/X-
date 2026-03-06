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
  Modal,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type TabType = 'home' | 'osint' | 'password' | 'website' | 'chat' | 'intel' | 'defense' | 'eye' | 'cellular' | 'secrets' | 'dorks' | 'mexosint' | 'realapis' | 'pentest' | 'cybertools' | 'c2' | 'ctf';
type EyeSubTab = 'search' | 'map' | 'breach' | 'domain';
type CellularSubTab = 'dashboard' | 'tools' | 'hardware' | 'attacks' | 'scan' | 'mexico';
type SecretsSubTab = 'scanner' | 'patterns' | 'keyhacks';
type DorksSubTab = 'database' | 'operators' | 'builder';
type MexSubTab = 'dashboard' | 'states' | 'cities' | 'zipcode' | 'curp' | 'telecom';
type RealSubTab = 'shodan' | 'breach' | 'ssl' | 'weather' | 'safebrowsing';
type PentestSubTab = 'dashboard' | 'portscan' | 'sniffer' | 'bruteforce' | 'exploits' | 'trojans' | 'sitemap' | 'recon';
type CyberToolsSubTab = 'portscan' | 'dns' | 'whois' | 'hash' | 'crack' | 'encode' | 'jwt' | 'passgen' | 'passcheck' | 'subnet' | 'headers' | 'ping';
type C2SubTab = 'dashboard' | 'agents' | 'commands' | 'payloads' | 'labs' | 'audit';

// World Map Component
const WorldMap = ({ markers = [], onRegionPress }: { markers: any[], onRegionPress?: (region: any) => void }) => {
  const mapWidth = width - 32;
  const mapHeight = 200;
  
  // Simplified world map projection
  const latLonToXY = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  };

  // Continent outlines (simplified)
  const continents = [
    // North America
    "M50,60 L120,40 L140,60 L130,90 L90,100 L60,90 Z",
    // South America
    "M80,110 L100,100 L110,130 L100,170 L80,160 L70,130 Z",
    // Europe
    "M160,50 L190,40 L200,60 L180,80 L160,70 Z",
    // Africa
    "M160,80 L200,80 L210,130 L180,160 L150,130 L150,100 Z",
    // Asia
    "M200,30 L280,20 L300,60 L280,90 L240,100 L200,80 L190,50 Z",
    // Oceania
    "M260,130 L300,120 L310,150 L280,160 L260,150 Z",
  ];

  return (
    <View style={styles.mapContainer}>
      <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Line key={`h${i}`} x1={0} y1={i * 50} x2={mapWidth} y2={i * 50} stroke="#1a3a2a" strokeWidth={0.5} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={mapHeight} stroke="#1a3a2a" strokeWidth={0.5} />
        ))}
        
        {/* Continents */}
        {continents.map((d, i) => (
          <Path key={i} d={d} fill="#0d2818" stroke="#00ff88" strokeWidth={1} opacity={0.6} />
        ))}
        
        {/* Markers */}
        {markers.map((marker, i) => {
          const { x, y } = latLonToXY(marker.lat, marker.lon);
          return (
            <G key={i}>
              <Circle cx={x} cy={y} r={8} fill="#ff000040" />
              <Circle cx={x} cy={y} r={4} fill="#ff0000" />
              <SvgText x={x} y={y - 12} fill="#ff0000" fontSize={8} textAnchor="middle">
                {marker.count || marker.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// Animated Eye Component
const AnimatedEye = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.eyeContainer}>
      <Animated.View style={[styles.eyeOuter, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.eyeInner}>
          <Animated.View style={[styles.eyePupil, { transform: [{ rotate }] }]}>
            <View style={styles.eyeHighlight} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [eyeSubTab, setEyeSubTab] = useState<EyeSubTab>('search');
  const [loading, setLoading] = useState(false);

  // Basic states
  const [osintUsername, setOsintUsername] = useState('');
  const [osintResults, setOsintResults] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [passwordResult, setPasswordResult] = useState<any>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteResult, setWebsiteResult] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const scrollViewRef = useRef<ScrollView>(null);

  // Eye states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [cameraData, setCameraData] = useState<any>(null);
  const [breachEmail, setBreachEmail] = useState('');
  const [breachResult, setBreachResult] = useState<any>(null);
  const [domainQuery, setDomainQuery] = useState('');
  const [domainResult, setDomainResult] = useState<any>(null);

  // Cellular states
  const [cellularSubTab, setCellularSubTab] = useState<CellularSubTab>('dashboard');
  const [cellularDashboard, setCellularDashboard] = useState<any>(null);
  const [cellularTools, setCellularTools] = useState<any>(null);
  const [cellularHardware, setCellularHardware] = useState<any>(null);
  const [cellularAttacks, setCellularAttacks] = useState<any>(null);
  const [cellularScan, setCellularScan] = useState<any>(null);
  const [cellularMexico, setCellularMexico] = useState<any>(null);
  const [toolSearch, setToolSearch] = useState('');

  // Secret Scanner states
  const [secretsSubTab, setSecretsSubTab] = useState<SecretsSubTab>('scanner');
  const [secretScanText, setSecretScanText] = useState('');
  const [secretScanResult, setSecretScanResult] = useState<any>(null);
  const [secretPatterns, setSecretPatterns] = useState<any>(null);
  const [keyhacksData, setKeyhacksData] = useState<any>(null);

  // Google Dorks states
  const [dorksSubTab, setDorksSubTab] = useState<DorksSubTab>('database');
  const [dorksData, setDorksData] = useState<any>(null);
  const [dorksOperators, setDorksOperators] = useState<any>(null);
  const [dorkTarget, setDorkTarget] = useState('');
  const [dorkType, setDorkType] = useState('general');
  const [dorkBuilderResult, setDorkBuilderResult] = useState<any>(null);
  const [dorkSearchFilter, setDorkSearchFilter] = useState('');
  const [dorkCategoryFilter, setDorkCategoryFilter] = useState('');

  // Mexico OSINT v2 states
  const [mexSubTab, setMexSubTab] = useState<MexSubTab>('dashboard');
  const [mexDashboard, setMexDashboard] = useState<any>(null);
  const [mexStates, setMexStates] = useState<any>(null);
  const [mexCities, setMexCities] = useState<any>(null);
  const [mexZipInput, setMexZipInput] = useState('');
  const [mexZipResult, setMexZipResult] = useState<any>(null);
  const [mexCurpInput, setMexCurpInput] = useState('');
  const [mexCurpResult, setMexCurpResult] = useState<any>(null);
  const [mexTelecom, setMexTelecom] = useState<any>(null);

  // Real APIs states
  const [realSubTab, setRealSubTab] = useState<RealSubTab>('shodan');
  const [shodanIp, setShodanIp] = useState('');
  const [shodanResult, setShodanResult] = useState<any>(null);
  const [realBreachEmail, setRealBreachEmail] = useState('');
  const [realBreachResult, setRealBreachResult] = useState<any>(null);
  const [sslDomain, setSslDomain] = useState('');
  const [sslResult, setSslResult] = useState<any>(null);
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherResult, setWeatherResult] = useState<any>(null);
  const [safeBrowsingUrl, setSafeBrowsingUrl] = useState('');
  const [safeBrowsingResult, setSafeBrowsingResult] = useState<any>(null);

  // Pentesting Lab states
  const [pentestSubTab, setPentestSubTab] = useState<PentestSubTab>('dashboard');
  const [pentestDash, setPentestDash] = useState<any>(null);
  const [labTargets, setLabTargets] = useState<any>(null);
  const [portScanTarget, setPortScanTarget] = useState('lab-web-01');
  const [portScanResult, setPortScanResult] = useState<any>(null);
  const [snifferResult, setSnifferResult] = useState<any>(null);
  const [bruteTarget, setBruteTarget] = useState('lab-web-01');
  const [bruteUser, setBruteUser] = useState('admin');
  const [bruteResult, setBruteResult] = useState<any>(null);
  const [exploitsDb, setExploitsDb] = useState<any>(null);
  const [exploitTarget, setExploitTarget] = useState('lab-web-01');
  const [exploitResult, setExploitResult] = useState<any>(null);
  const [trojanTemplates, setTrojanTemplates] = useState<any>(null);
  const [trojanAnalysis, setTrojanAnalysis] = useState<any>(null);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [sitemapResult, setSitemapResult] = useState<any>(null);
  const [reconUser, setReconUser] = useState('');
  const [reconResult, setReconResult] = useState<any>(null);

  // Cyber Tools states
  const [ctSubTab, setCtSubTab] = useState<CyberToolsSubTab>('portscan');
  const [ctInput, setCtInput] = useState('');
  const [ctInput2, setCtInput2] = useState('');
  const [ctResult, setCtResult] = useState<any>(null);
  const [ctEncodeOp, setCtEncodeOp] = useState('base64_encode');

  // C2 Dashboard states
  const [c2SubTab, setC2SubTab] = useState<C2SubTab>('dashboard');
  const [c2Dashboard, setC2Dashboard] = useState<any>(null);
  const [c2Agents, setC2Agents] = useState<any[]>([]);
  const [c2PlatformFilter, setC2PlatformFilter] = useState('');
  const [c2SelectedAgent, setC2SelectedAgent] = useState<any>(null);
  const [c2AgentDetail, setC2AgentDetail] = useState<any>(null);
  const [c2TaskCmd, setC2TaskCmd] = useState('');
  const [c2TaskResult, setC2TaskResult] = useState<any>(null);
  const [c2Payloads, setC2Payloads] = useState<any>(null);
  const [c2BuildPlatform, setC2BuildPlatform] = useState('android');
  const [c2BuildType, setC2BuildType] = useState('rat');
  const [c2BuildResult, setC2BuildResult] = useState<any>(null);
  const [c2Labs, setC2Labs] = useState<any>(null);
  const [c2Audit, setC2Audit] = useState<any>(null);

  // Load C2 data
  useEffect(() => {
    if (activeTab === 'c2') {
      loadC2Dashboard();
      loadC2Agents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'c2' && c2SubTab === 'payloads') loadC2Payloads();
    if (activeTab === 'c2' && c2SubTab === 'labs') loadC2Labs();
    if (activeTab === 'c2' && c2SubTab === 'audit') loadC2Audit();
  }, [activeTab, c2SubTab]);

  // CTF Red Team states
  const [ctfExercises, setCtfExercises] = useState<any[]>([]);
  const [ctfLeaderboard, setCtfLeaderboard] = useState<any>(null);
  const [ctfActiveExercise, setCtfActiveExercise] = useState<any>(null);
  const [ctfCurrentStep, setCtfCurrentStep] = useState<any>(null);
  const [ctfStepIndex, setCtfStepIndex] = useState(0);
  const [ctfStepResult, setCtfStepResult] = useState<any>(null);
  const [ctfScore, setCtfScore] = useState(0);
  const [ctfComplete, setCtfComplete] = useState(false);
  const [ctfView, setCtfView] = useState<'list' | 'play' | 'leaderboard'>('list');

  // Training Platforms modal
  const [showPlatforms, setShowPlatforms] = useState(false);
  const TRAINING_PLATFORMS = [
    { emoji: '🧪', name: 'Hack The Box', desc: 'Hacking labs', url: 'https://www.hackthebox.com', color: '#9fef00' },
    { emoji: '🌱', name: 'TryHackMe', desc: 'Beginner training', url: 'https://tryhackme.com', color: '#88cc14' },
    { emoji: '🎮', name: 'OverTheWire', desc: 'Security wargames', url: 'https://overthewire.org/wargames/', color: '#00ccff' },
    { emoji: '🧩', name: 'Root Me', desc: 'Hacking challenges', url: 'https://www.root-me.org', color: '#ffcc00' },
    { emoji: '🏴', name: 'Hack This Site', desc: 'Classic practice', url: 'https://www.hackthissite.org', color: '#ff6600' },
    { emoji: '🏁', name: 'picoCTF', desc: 'CTF training', url: 'https://picoctf.org', color: '#3ddc84' },
    { emoji: '⚔️', name: 'PwnTillDawn', desc: 'Pentest labs', url: 'https://www.wizlynxgroup.com/news/2020/02/18/pwntilldawn/', color: '#ff003c' },
    { emoji: '🐦', name: 'Parrot CTFs', desc: 'Security CTFs', url: 'https://parrotctfs.com', color: '#00bcd4' },
    { emoji: '🌐', name: 'PentesterLab', desc: 'Web pentesting', url: 'https://pentesterlab.com', color: '#aa00ff' },
    { emoji: '🏢', name: 'Immersive Labs', desc: 'Cyber training', url: 'https://www.immersivelabs.com', color: '#ff4081' },
    { emoji: '🧨', name: 'Proving Grounds', desc: 'Pentest labs', url: 'https://www.offsec.com/labs/', color: '#ff5722' },
    { emoji: '🛡️', name: 'RangeForce', desc: 'Blue team training', url: 'https://www.rangeforce.com', color: '#2196f3' },
  ];

  useEffect(() => {
    if (activeTab === 'ctf') { loadCtfExercises(); loadCtfLeaderboard(); }
  }, [activeTab]);

  // Load global stats on Eye tab
  useEffect(() => {
    if (activeTab === 'eye') {
      loadGlobalStats();
      loadCameraData();
    }
  }, [activeTab]);

  // Load cellular data
  useEffect(() => {
    if (activeTab === 'cellular') {
      loadCellularDashboard();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'cellular') {
      if (cellularSubTab === 'tools' && !cellularTools) loadCellularTools();
      if (cellularSubTab === 'hardware' && !cellularHardware) loadCellularHardware();
      if (cellularSubTab === 'attacks' && !cellularAttacks) loadCellularAttacks();
      if (cellularSubTab === 'mexico' && !cellularMexico) loadCellularMexico();
    }
  }, [cellularSubTab, activeTab]);

  // API functions
  const scanOSINT = async () => {
    if (!osintUsername.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/osint/scan`, { username: osintUsername });
      setOsintResults(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const checkPassword = async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/password/check`, { password });
      setPasswordResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const analyzeWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/website/analyze`, { url: websiteUrl });
      setWebsiteResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/chat`, { session_id: sessionId, message: msg });
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error...' }]);
    }
    setLoading(false);
  };

  // Eye API functions
  const loadGlobalStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/eye/global-stats`);
      setGlobalStats(response.data);
    } catch (error) { console.error(error); }
  };

  const loadCameraData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/eye/public-cameras`);
      setCameraData(response.data);
    } catch (error) { console.error(error); }
  };

  const deepSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/eye/deep-search`, { query: searchQuery, search_type: searchType });
      setSearchResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const checkBreach = async () => {
    if (!breachEmail.trim()) return;
    setLoading(true);
    setBreachResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/eye/breach-check`, { email: breachEmail });
      setBreachResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const getDomainIntel = async () => {
    if (!domainQuery.trim()) return;
    setLoading(true);
    setDomainResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/eye/domain-intel`, { domain: domainQuery });
      setDomainResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  // Cellular API functions
  const loadCellularDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cellular/dashboard`);
      setCellularDashboard(response.data);
    } catch (error) { console.error(error); }
  };

  const loadCellularTools = async () => {
    try {
      const search = toolSearch ? `?search=${toolSearch}` : '';
      const response = await axios.get(`${API_URL}/api/cellular/tools${search}`);
      setCellularTools(response.data);
    } catch (error) { console.error(error); }
  };

  const loadCellularHardware = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cellular/hardware`);
      setCellularHardware(response.data);
    } catch (error) { console.error(error); }
  };

  const loadCellularAttacks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cellular/attack-vectors`);
      setCellularAttacks(response.data);
    } catch (error) { console.error(error); }
  };

  const runCellularScan = async () => {
    setLoading(true);
    setCellularScan(null);
    try {
      const response = await axios.get(`${API_URL}/api/cellular/realtime-scan`);
      setCellularScan(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const loadCellularMexico = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cellular/mexico-telecom`);
      setCellularMexico(response.data);
    } catch (error) { console.error(error); }
  };

  const getSeverityColor = (s: string) => {
    switch(s) {
      case 'CRITICAL': return '#ff0040';
      case 'HIGH': return '#ff6600';
      case 'MEDIUM': return '#ffcc00';
      case 'LOW': return '#00ff88';
      default: return '#888';
    }
  };

  // ========== SECRET SCANNER API FUNCTIONS ==========
  const scanSecrets = async () => {
    if (!secretScanText.trim()) return;
    setLoading(true);
    setSecretScanResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/secrets/scan`, { text: secretScanText });
      setSecretScanResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const loadSecretPatterns = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/secrets/patterns`);
      setSecretPatterns(response.data);
    } catch (error) { console.error(error); }
  };

  const loadKeyhacks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/secrets/keyhacks`);
      setKeyhacksData(response.data);
    } catch (error) { console.error(error); }
  };

  // ========== GOOGLE DORKS API FUNCTIONS ==========
  const loadDorksDatabase = async () => {
    try {
      const params: string[] = [];
      if (dorkSearchFilter) params.push(`search=${dorkSearchFilter}`);
      if (dorkCategoryFilter) params.push(`category=${dorkCategoryFilter}`);
      const qs = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await axios.get(`${API_URL}/api/dorks/database${qs}`);
      setDorksData(response.data);
    } catch (error) { console.error(error); }
  };

  const loadDorksOperators = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dorks/operators`);
      setDorksOperators(response.data);
    } catch (error) { console.error(error); }
  };

  const buildDork = async () => {
    if (!dorkTarget.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/dorks/build?target=${dorkTarget}&dork_type=${dorkType}`);
      setDorkBuilderResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  // ========== MEXICO OSINT v2 API FUNCTIONS ==========
  const loadMexDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mexico/dashboard`);
      setMexDashboard(response.data);
    } catch (error) { console.error(error); }
  };

  const loadMexStates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mexico/states`);
      setMexStates(response.data);
    } catch (error) { console.error(error); }
  };

  const loadMexCities = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mexico/cities`);
      setMexCities(response.data);
    } catch (error) { console.error(error); }
  };

  const lookupMexZip = async () => {
    if (!mexZipInput.trim()) return;
    setLoading(true);
    setMexZipResult(null);
    try {
      const response = await axios.get(`${API_URL}/api/mexico/zipcode/${mexZipInput}`);
      setMexZipResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const validateCurp = async () => {
    if (!mexCurpInput.trim()) return;
    setLoading(true);
    setMexCurpResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/mexico/validate/curp?curp=${mexCurpInput}`);
      setMexCurpResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const loadMexTelecom = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mexico/telecom`);
      setMexTelecom(response.data);
    } catch (error) { console.error(error); }
  };

  // ========== REAL APIS FUNCTIONS ==========
  const shodanLookup = async () => {
    if (!shodanIp.trim()) return;
    setLoading(true);
    setShodanResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/real/ip-lookup`, { ip: shodanIp });
      setShodanResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const realBreachCheck = async () => {
    if (!realBreachEmail.trim()) return;
    setLoading(true);
    setRealBreachResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/real/breach-check`, { email: realBreachEmail });
      setRealBreachResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const checkSSL = async () => {
    if (!sslDomain.trim()) return;
    setLoading(true);
    setSslResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/real/ssl-check`, { domain: sslDomain });
      setSslResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const checkWeather = async () => {
    if (!weatherCity.trim()) return;
    setLoading(true);
    setWeatherResult(null);
    try {
      // Use Mexico City coords as default, or parse city name
      const cityCoords: Record<string, [number, number]> = {
        'mexico': [19.43, -99.13], 'guadalajara': [20.66, -103.35], 'monterrey': [25.69, -100.32],
        'cancun': [21.16, -86.85], 'tijuana': [32.51, -117.04], 'puebla': [19.04, -98.21],
        'merida': [20.97, -89.59], 'oaxaca': [17.07, -96.73], 'acapulco': [16.85, -99.82],
      };
      const key = weatherCity.toLowerCase().split(' ')[0];
      const coords = cityCoords[key] || [19.43, -99.13];
      const response = await axios.get(`${API_URL}/api/real/weather/${coords[0]}/${coords[1]}`);
      setWeatherResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const checkSafeBrowsing = async () => {
    if (!safeBrowsingUrl.trim()) return;
    setLoading(true);
    setSafeBrowsingResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/real/safe-browsing`, { url: safeBrowsingUrl });
      setSafeBrowsingResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  // ========== useEffects for new modules ==========
  useEffect(() => {
    if (activeTab === 'secrets') {
      if (secretsSubTab === 'patterns' && !secretPatterns) loadSecretPatterns();
      if (secretsSubTab === 'keyhacks' && !keyhacksData) loadKeyhacks();
    }
  }, [activeTab, secretsSubTab]);

  useEffect(() => {
    if (activeTab === 'dorks') {
      if (dorksSubTab === 'database') loadDorksDatabase();
      if (dorksSubTab === 'operators' && !dorksOperators) loadDorksOperators();
    }
  }, [activeTab, dorksSubTab, dorkCategoryFilter]);

  useEffect(() => {
    if (activeTab === 'mexosint') {
      if (mexSubTab === 'dashboard' && !mexDashboard) loadMexDashboard();
      if (mexSubTab === 'states' && !mexStates) loadMexStates();
      if (mexSubTab === 'cities' && !mexCities) loadMexCities();
      if (mexSubTab === 'telecom' && !mexTelecom) loadMexTelecom();
    }
  }, [activeTab, mexSubTab]);

  // ========== PENTESTING LAB API FUNCTIONS ==========
  const loadPentestDash = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pentest/dashboard`);
      setPentestDash(response.data);
    } catch (error) { console.error(error); }
  };

  const loadLabTargets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pentest/lab/targets`);
      setLabTargets(response.data);
    } catch (error) { console.error(error); }
  };

  const runPortScan = async () => {
    if (!portScanTarget.trim()) return;
    setLoading(true);
    setPortScanResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/scan/ports`, { target: portScanTarget, scan_type: 'quick' });
      setPortScanResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const runSniffer = async () => {
    setLoading(true);
    setSnifferResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/scan/sniffer`, { interface: 'eth0', duration: 10 });
      setSnifferResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const runBruteforce = async () => {
    if (!bruteTarget.trim()) return;
    setLoading(true);
    setBruteResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/attack/bruteforce`, { target: bruteTarget, username: bruteUser, service: 'ssh' });
      setBruteResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const loadExploits = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pentest/exploits`);
      setExploitsDb(response.data);
    } catch (error) { console.error(error); }
  };

  const runExploit = async (exploitId?: string) => {
    setLoading(true);
    setExploitResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/attack/exploit`, { target: exploitTarget, exploit_id: exploitId || '', payload: 'reverse_shell' });
      setExploitResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const loadTrojanTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pentest/trojan/templates`);
      setTrojanTemplates(response.data);
    } catch (error) { console.error(error); }
  };

  const analyzeTrojan = async (name?: string) => {
    setLoading(true);
    setTrojanAnalysis(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/trojan/analyze`, { file_name: name || 'malware.exe' });
      setTrojanAnalysis(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const runSitemap = async () => {
    if (!sitemapUrl.trim()) return;
    setLoading(true);
    setSitemapResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/recon/sitemap`, { url: sitemapUrl, depth: 3 });
      setSitemapResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const runUserRecon = async () => {
    if (!reconUser.trim()) return;
    setLoading(true);
    setReconResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/pentest/recon/user`, { username: reconUser });
      setReconResult(response.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'pentest') {
      if (pentestSubTab === 'dashboard' && !pentestDash) { loadPentestDash(); loadLabTargets(); }
      if (pentestSubTab === 'exploits' && !exploitsDb) loadExploits();
      if (pentestSubTab === 'trojans' && !trojanTemplates) loadTrojanTemplates();
    }
  }, [activeTab, pentestSubTab]);

  // ========== CYBER TOOLS UNIVERSAL EXECUTOR ==========
  const runCyberTool = async () => {
    if (!ctInput.trim() && ctSubTab !== 'passgen') return;
    setLoading(true);
    setCtResult(null);
    try {
      let response;
      switch (ctSubTab) {
        case 'portscan':
          response = await axios.post(`${API_URL}/api/tools/port-scan`, { target: ctInput, ports: ctInput2 || "21,22,23,25,53,80,110,143,443,445,3306,3389,5432,8080" });
          break;
        case 'dns':
          response = await axios.post(`${API_URL}/api/tools/dns-lookup`, { domain: ctInput });
          break;
        case 'whois':
          response = await axios.post(`${API_URL}/api/tools/whois`, { domain: ctInput });
          break;
        case 'hash':
          response = await axios.post(`${API_URL}/api/tools/hash`, { text: ctInput });
          break;
        case 'crack':
          response = await axios.post(`${API_URL}/api/tools/crack-hash`, { hash_value: ctInput });
          break;
        case 'encode':
          response = await axios.post(`${API_URL}/api/tools/encode`, { text: ctInput, operation: ctEncodeOp });
          break;
        case 'jwt':
          response = await axios.post(`${API_URL}/api/tools/jwt-decode`, { token: ctInput });
          break;
        case 'passgen':
          response = await axios.post(`${API_URL}/api/tools/password-gen`, { length: parseInt(ctInput) || 20, count: 5 });
          break;
        case 'passcheck':
          response = await axios.post(`${API_URL}/api/tools/password-check`, { password: ctInput });
          break;
        case 'subnet':
          response = await axios.post(`${API_URL}/api/tools/subnet`, { cidr: ctInput });
          break;
        case 'headers':
          response = await axios.post(`${API_URL}/api/tools/http-headers`, { url: ctInput });
          break;
        case 'ping':
          response = await axios.post(`${API_URL}/api/tools/ping`, { target: ctInput, count: 4 });
          break;
      }
      if (response) setCtResult(response.data);
    } catch (error: any) {
      setCtResult({ error: error.response?.data?.detail || 'Error ejecutando herramienta' });
    }
    setLoading(false);
  };

  // ============ C2 Dashboard Functions ============
  const loadC2Dashboard = async () => {
    try { const r = await axios.get(`${API_URL}/api/c2/dashboard`); setC2Dashboard(r.data); } catch {}
  };
  const loadC2Agents = async (platform?: string) => {
    try {
      const params = platform ? `?platform=${platform}` : '';
      const r = await axios.get(`${API_URL}/api/c2/agents${params}`);
      setC2Agents(r.data.agents);
    } catch {}
  };
  const loadC2AgentDetail = async (agentId: string) => {
    try { const r = await axios.get(`${API_URL}/api/c2/agent/${agentId}`); setC2AgentDetail(r.data); } catch {}
  };
  const sendC2Task = async () => {
    if (!c2SelectedAgent || !c2TaskCmd) return;
    setLoading(true); setC2TaskResult(null);
    try {
      const r = await axios.post(`${API_URL}/api/c2/agent/${c2SelectedAgent.id}/task`, { agent_id: c2SelectedAgent.id, command: c2TaskCmd });
      setC2TaskResult(r.data);
    } catch (e: any) { setC2TaskResult({ error: e.response?.data?.detail || 'Error' }); }
    setLoading(false);
  };
  const loadC2Payloads = async () => {
    try { const r = await axios.get(`${API_URL}/api/c2/payloads`); setC2Payloads(r.data); } catch {}
  };
  const buildC2Payload = async () => {
    setLoading(true); setC2BuildResult(null);
    try {
      const r = await axios.post(`${API_URL}/api/c2/build`, { platform: c2BuildPlatform, payload_type: c2BuildType });
      setC2BuildResult(r.data);
    } catch (e: any) { setC2BuildResult({ error: e.response?.data?.detail || 'Build error' }); }
    setLoading(false);
  };
  const loadC2Labs = async () => {
    try { const r = await axios.get(`${API_URL}/api/c2/lab/environments`); setC2Labs(r.data); } catch {}
  };
  const loadC2Audit = async () => {
    try { const r = await axios.get(`${API_URL}/api/c2/audit`); setC2Audit(r.data); } catch {}
  };

  const getPlatformIcon = (p: string) => {
    switch (p) { case 'windows': return 'microsoft-windows'; case 'linux': return 'linux'; case 'android': return 'android'; case 'ios': return 'apple'; default: return 'devices'; }
  };
  const getPlatformColor = (p: string) => {
    switch (p) { case 'windows': return '#00a4ef'; case 'linux': return '#ffcc00'; case 'android': return '#3ddc84'; case 'ios': return '#aaa'; default: return '#fff'; }
  };

  // ============ C2 Dashboard Render ============
  const renderC2 = () => {
    const c2Tabs: { key: C2SubTab; label: string; icon: string }[] = [
      { key: 'dashboard', label: 'Panel', icon: 'monitor-dashboard' },
      { key: 'agents', label: 'Agents', icon: 'cellphone-link' },
      { key: 'commands', label: 'CMD', icon: 'console' },
      { key: 'payloads', label: 'Build', icon: 'package-variant-closed' },
      { key: 'labs', label: 'Labs', icon: 'flask' },
      { key: 'audit', label: 'Audit', icon: 'clipboard-text' },
    ];

    return (
      <View style={styles.tabContent}>
        {/* Header */}
        <View style={styles.eyeHeader}>
          <TouchableOpacity onPress={() => setActiveTab('home')}>
            <Ionicons name="arrow-back" size={28} color="#ff003c" />
          </TouchableOpacity>
          <View style={styles.eyeTitleContainer}>
            <MaterialCommunityIcons name="skull" size={24} color="#ff003c" />
            <Text style={[styles.eyeTitle, { color: '#ff003c' }]}>C2 DASHBOARD</Text>
          </View>
          <View style={{ backgroundColor: '#ff003c20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ color: '#ff003c', fontSize: 8, fontWeight: 'bold' }}>SIM LAB</Text>
          </View>
        </View>

        {/* Sub tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 42, marginBottom: 10 }}>
          {c2Tabs.map(t => (
            <TouchableOpacity key={t.key}
              style={[styles.cellSubTab, c2SubTab === t.key && { backgroundColor: '#ff003c' }]}
              onPress={() => setC2SubTab(t.key)}>
              <MaterialCommunityIcons name={t.icon as any} size={14} color={c2SubTab === t.key ? '#000' : '#ff003c'} />
              <Text style={[styles.cellSubTabText, { color: c2SubTab === t.key ? '#000' : '#ff003c' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* ===== DASHBOARD TAB ===== */}
          {c2SubTab === 'dashboard' && (
            <>
              {c2Dashboard ? (
                <>
                  {/* Stats row */}
                  <View style={[styles.statsBar, { borderColor: '#ff003c40' }]}>
                    <View style={styles.statItem}><Text style={[styles.statValue, { color: '#ff003c' }]}>{c2Dashboard.total_agents}</Text><Text style={[styles.statLabel, { color: '#ff668a' }]}>Agents</Text></View>
                    <View style={styles.statItem}><Text style={[styles.statValue, { color: '#3ddc84' }]}>{c2Dashboard.active_agents}</Text><Text style={[styles.statLabel, { color: '#ff668a' }]}>Active</Text></View>
                    <View style={styles.statItem}><Text style={[styles.statValue, { color: '#ffcc00' }]}>{c2Dashboard.dormant_agents}</Text><Text style={[styles.statLabel, { color: '#ff668a' }]}>Dormant</Text></View>
                    <View style={styles.statItem}><Text style={[styles.statValue, { color: '#ff003c' }]}>{c2Dashboard.total_payloads}</Text><Text style={[styles.statLabel, { color: '#ff668a' }]}>Payloads</Text></View>
                  </View>

                  {/* Platform cards */}
                  <Text style={[styles.sectionTitle, { color: '#ff003c' }]}>PLATAFORMAS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {Object.entries(c2Dashboard.platforms).map(([platform, count]) => (
                      <TouchableOpacity key={platform}
                        onPress={() => { setC2PlatformFilter(platform); loadC2Agents(platform); setC2SubTab('agents'); }}
                        style={{ flex: 1, minWidth: '45%', backgroundColor: '#0d0508', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: getPlatformColor(platform) + '40' }}>
                        <MaterialCommunityIcons name={getPlatformIcon(platform) as any} size={28} color={getPlatformColor(platform)} />
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{platform.toUpperCase()}</Text>
                        <Text style={{ color: getPlatformColor(platform), fontSize: 20, fontWeight: 'bold' }}>{count as number}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* C2 Server info */}
                  <Text style={[styles.sectionTitle, { color: '#ff003c' }]}>C2 SERVER</Text>
                  <View style={{ backgroundColor: '#0d0508', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ff003c30', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#888', fontSize: 11 }}>IP</Text><Text style={{ color: '#ff003c', fontSize: 11, fontFamily: 'monospace' }}>{c2Dashboard.c2_server.ip}:{c2Dashboard.c2_server.port}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#888', fontSize: 11 }}>Protocol</Text><Text style={{ color: '#3ddc84', fontSize: 11 }}>{c2Dashboard.c2_server.protocol}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#888', fontSize: 11 }}>Uptime</Text><Text style={{ color: '#ffcc00', fontSize: 11 }}>{c2Dashboard.c2_server.uptime}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#ff003c10', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#ff003c30' }}>
                    <Text style={{ color: '#ff668a', fontSize: 10, textAlign: 'center' }}>ENTORNO 100% SIMULADO - Solo para fines educativos y auditorias</Text>
                  </View>
                </>
              ) : <ActivityIndicator color="#ff003c" size="large" style={{ marginTop: 40 }} />}
            </>
          )}

          {/* ===== AGENTS TAB ===== */}
          {c2SubTab === 'agents' && (
            <>
              {/* Platform filter */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity onPress={() => { setC2PlatformFilter(''); loadC2Agents(); }}
                  style={[styles.searchTypeBtn, !c2PlatformFilter && styles.searchTypeBtnActive, !c2PlatformFilter && { backgroundColor: '#ff003c' }]}>
                  <Text style={[styles.searchTypeText, !c2PlatformFilter && { color: '#000' }]}>ALL</Text>
                </TouchableOpacity>
                {['windows', 'linux', 'android', 'ios'].map(p => (
                  <TouchableOpacity key={p} onPress={() => { setC2PlatformFilter(p); loadC2Agents(p); }}
                    style={[styles.searchTypeBtn, c2PlatformFilter === p && { backgroundColor: getPlatformColor(p) }]}>
                    <Text style={[styles.searchTypeText, c2PlatformFilter === p && { color: '#000' }]}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {c2Agents.map(agent => (
                <TouchableOpacity key={agent.id}
                  onPress={() => { setC2SelectedAgent(agent); loadC2AgentDetail(agent.id); setC2SubTab('commands'); setC2TaskResult(null); setC2TaskCmd(''); }}
                  style={{ backgroundColor: '#0d0508', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: agent.status === 'active' ? '#3ddc8440' : '#ffcc0040', borderLeftWidth: 3, borderLeftColor: getPlatformColor(agent.platform) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons name={getPlatformIcon(agent.platform) as any} size={20} color={getPlatformColor(agent.platform)} />
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{agent.id}</Text>
                    </View>
                    <View style={{ backgroundColor: agent.status === 'active' ? '#3ddc8420' : '#ffcc0020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: agent.status === 'active' ? '#3ddc84' : '#ffcc00', fontSize: 9, fontWeight: 'bold' }}>{agent.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#888', fontSize: 10 }}>{agent.hostname} | {agent.os}</Text>
                  <Text style={{ color: '#666', fontSize: 10 }}>IP: {agent.ip} | User: {agent.user} | Priv: {agent.privileges}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: '#ff003c', fontSize: 9 }}>{agent.implant} v{agent.version}</Text>
                    <Text style={{ color: '#555', fontSize: 9 }}>Last: {agent.last_seen}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {c2Agents.length === 0 && <ActivityIndicator color="#ff003c" style={{ marginTop: 20 }} />}
            </>
          )}

          {/* ===== COMMANDS TAB ===== */}
          {c2SubTab === 'commands' && (
            <>
              {c2SelectedAgent ? (
                <>
                  {/* Agent info header */}
                  <View style={{ backgroundColor: '#0d0508', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: getPlatformColor(c2SelectedAgent.platform) + '40', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <MaterialCommunityIcons name={getPlatformIcon(c2SelectedAgent.platform) as any} size={22} color={getPlatformColor(c2SelectedAgent.platform)} />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{c2SelectedAgent.id}</Text>
                      <Text style={{ color: '#888', fontSize: 11 }}>({c2SelectedAgent.hostname})</Text>
                    </View>
                    <Text style={{ color: '#666', fontSize: 10 }}>{c2SelectedAgent.os} | {c2SelectedAgent.ip} | {c2SelectedAgent.privileges}</Text>
                  </View>

                  {/* Available commands */}
                  {c2AgentDetail && (
                    <>
                      <Text style={[styles.sectionTitle, { color: '#ff003c' }]}>COMANDOS ({c2AgentDetail.command_count})</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {c2AgentDetail.available_commands.map((cmd: string) => (
                          <TouchableOpacity key={cmd} onPress={() => setC2TaskCmd(cmd)}
                            style={{ backgroundColor: c2TaskCmd === cmd ? '#ff003c' : '#0d0508', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ff003c40' }}>
                            <Text style={{ color: c2TaskCmd === cmd ? '#000' : '#ff668a', fontSize: 10, fontWeight: 'bold' }}>{cmd}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[styles.eyeButton, { backgroundColor: '#ff003c' }, (!c2TaskCmd || loading) && styles.buttonDisabled]}
                        onPress={sendC2Task} disabled={!c2TaskCmd || loading}>
                        {loading ? <ActivityIndicator color="#000" /> : (
                          <><MaterialCommunityIcons name="send" size={16} color="#000" /><Text style={styles.eyeButtonText}>EXECUTE: {c2TaskCmd || '...'}</Text></>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Task result */}
                  {c2TaskResult && (
                    <View style={{ backgroundColor: '#0d0508', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c2TaskResult.error ? '#ff444440' : '#3ddc8440' }}>
                      {c2TaskResult.error ? (
                        <Text style={{ color: '#ff4444', fontSize: 12 }}>{c2TaskResult.error}</Text>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: '#3ddc84', fontSize: 12, fontWeight: 'bold' }}>Task: {c2TaskResult.task_id}</Text>
                            <Text style={{ color: '#888', fontSize: 10 }}>{c2TaskResult.execution_time_ms}ms</Text>
                          </View>
                          <View style={{ backgroundColor: '#000', borderRadius: 6, padding: 10 }}>
                            <Text style={{ color: '#3ddc84', fontSize: 11, fontFamily: 'monospace' }}>{c2TaskResult.result?.output || JSON.stringify(c2TaskResult.result, null, 2)}</Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <MaterialCommunityIcons name="cursor-default-click" size={48} color="#ff003c40" />
                  <Text style={{ color: '#ff668a', fontSize: 13, marginTop: 10 }}>Selecciona un agente en la tab "Agents"</Text>
                </View>
              )}
            </>
          )}

          {/* ===== PAYLOADS TAB ===== */}
          {c2SubTab === 'payloads' && (
            <>
              {/* Build section */}
              <Text style={[styles.sectionTitle, { color: '#ff003c' }]}>PAYLOAD BUILDER</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {['android', 'ios', 'linux', 'windows'].map(p => (
                  <TouchableOpacity key={p} onPress={() => setC2BuildPlatform(p)}
                    style={{ flex: 1, padding: 8, borderRadius: 6, alignItems: 'center', backgroundColor: c2BuildPlatform === p ? getPlatformColor(p) : '#0d0508', borderWidth: 1, borderColor: getPlatformColor(p) + '40' }}>
                    <MaterialCommunityIcons name={getPlatformIcon(p) as any} size={18} color={c2BuildPlatform === p ? '#000' : getPlatformColor(p)} />
                    <Text style={{ color: c2BuildPlatform === p ? '#000' : '#888', fontSize: 9, fontWeight: 'bold', marginTop: 2 }}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {['rat', 'keylogger', 'ransomware', 'rootkit', 'backdoor', 'stealer', 'spyware', 'beacon'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setC2BuildType(t)}
                    style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: c2BuildType === t ? '#ff003c' : '#0d0508', borderWidth: 1, borderColor: '#ff003c30' }}>
                    <Text style={{ color: c2BuildType === t ? '#000' : '#ff668a', fontSize: 10, fontWeight: 'bold' }}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.eyeButton, { backgroundColor: '#ff003c' }, loading && styles.buttonDisabled]} onPress={buildC2Payload} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="hammer-wrench" size={16} color="#000" /><Text style={styles.eyeButtonText}>BUILD PAYLOAD</Text></>}
              </TouchableOpacity>

              {c2BuildResult && !c2BuildResult.error && (
                <View style={{ backgroundColor: '#0d0508', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#3ddc8440', marginBottom: 12 }}>
                  <Text style={{ color: '#3ddc84', fontSize: 14, fontWeight: 'bold', marginBottom: 6 }}>Build: {c2BuildResult.build_id}</Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>{c2BuildResult.payload?.name}</Text>
                  <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>File: {c2BuildResult.output_file}</Text>
                  <Text style={{ color: '#888', fontSize: 10 }}>Size: {c2BuildResult.payload?.size} | Evasion: {c2BuildResult.payload?.evasion}</Text>
                  <Text style={{ color: '#ff003c', fontSize: 10, marginTop: 4 }}>Detection: {c2BuildResult.detection_rate}</Text>
                  <View style={{ backgroundColor: '#000', borderRadius: 4, padding: 6, marginTop: 6 }}>
                    <Text style={{ color: '#666', fontSize: 9, fontFamily: 'monospace' }}>SHA256: {c2BuildResult.file_hash?.substring(0, 32)}...</Text>
                  </View>
                </View>
              )}

              {/* Payload catalog */}
              <Text style={[styles.sectionTitle, { color: '#ff003c' }]}>CATALOGO DE PAYLOADS</Text>
              {c2Payloads?.all_payloads && Object.entries(c2Payloads.all_payloads).map(([platform, payloads]) => (
                <View key={platform} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <MaterialCommunityIcons name={getPlatformIcon(platform) as any} size={16} color={getPlatformColor(platform)} />
                    <Text style={{ color: getPlatformColor(platform), fontSize: 12, fontWeight: 'bold' }}>{platform.toUpperCase()}</Text>
                  </View>
                  {(payloads as any[]).map((p: any, i: number) => (
                    <View key={i} style={{ backgroundColor: '#0d0508', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 2, borderLeftColor: getPlatformColor(platform) }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{p.name}</Text>
                      <Text style={{ color: '#888', fontSize: 10 }}>Type: {p.type} | Size: {p.size}</Text>
                      <Text style={{ color: '#666', fontSize: 9, marginTop: 2 }}>Evasion: {p.evasion}</Text>
                      <Text style={{ color: '#666', fontSize: 9 }}>Capabilities: {p.capabilities}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}

          {/* ===== LABS TAB ===== */}
          {c2SubTab === 'labs' && (
            <>
              <Text style={[styles.sectionTitle, { color: '#ff003c' }]}>LAB ENVIRONMENTS</Text>
              {c2Labs?.labs?.map((lab: any, i: number) => (
                <View key={i} style={{ backgroundColor: '#0d0508', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ff003c30' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{lab.name}</Text>
                    <View style={{ backgroundColor: lab.difficulty === 'EXPERT' ? '#ff003c' : lab.difficulty === 'HARD' ? '#ff6600' : lab.difficulty === 'MEDIUM' ? '#ffcc00' : '#3ddc84', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#000', fontSize: 9, fontWeight: 'bold' }}>{lab.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>Network: {lab.network} | Agents: {lab.agents}</Text>
                  <Text style={{ color: '#ff668a', fontSize: 10, marginBottom: 6 }}>{lab.scenario}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {lab.targets.map((t: string, j: number) => (
                      <View key={j} style={{ backgroundColor: '#ff003c10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#ff668a', fontSize: 9 }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              {c2Labs?.disclaimer && (
                <View style={{ backgroundColor: '#ff003c10', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#ff003c30' }}>
                  <Text style={{ color: '#ff668a', fontSize: 10, textAlign: 'center' }}>{c2Labs.disclaimer}</Text>
                </View>
              )}
              {!c2Labs && <ActivityIndicator color="#ff003c" style={{ marginTop: 20 }} />}
            </>
          )}

          {/* ===== AUDIT TAB ===== */}
          {c2SubTab === 'audit' && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.sectionTitle, { color: '#ff003c', marginTop: 0, marginBottom: 0 }]}>AUDIT LOG</Text>
                <TouchableOpacity onPress={loadC2Audit} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="refresh" size={20} color="#ff003c" />
                </TouchableOpacity>
              </View>
              {c2Audit?.entries?.length > 0 ? (
                c2Audit.entries.slice().reverse().map((e: any, i: number) => (
                  <View key={i} style={{ backgroundColor: '#0d0508', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 2, borderLeftColor: e.result === 'success' ? '#3ddc84' : '#ff003c' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{e.action}</Text>
                      <Text style={{ color: '#555', fontSize: 9 }}>{e.timestamp?.split('T')[1]?.split('.')[0]}</Text>
                    </View>
                    <Text style={{ color: '#888', fontSize: 9 }}>Agent: {e.agent} | Platform: {e.platform} | User: {e.user}</Text>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                  <MaterialCommunityIcons name="clipboard-text-off" size={40} color="#ff003c40" />
                  <Text style={{ color: '#ff668a', fontSize: 12, marginTop: 8 }}>Sin registros de auditoria. Ejecuta comandos para generar logs.</Text>
                </View>
              )}
              {!c2Audit && <ActivityIndicator color="#ff003c" style={{ marginTop: 20 }} />}
            </>
          )}
        </ScrollView>
      </View>
    );
  };


  // ============ CTF Functions ============
  const loadCtfExercises = async () => {
    try { const r = await axios.get(`${API_URL}/api/ctf/exercises`); setCtfExercises(r.data.exercises); } catch {}
  };
  const loadCtfLeaderboard = async () => {
    try { const r = await axios.get(`${API_URL}/api/ctf/leaderboard`); setCtfLeaderboard(r.data); } catch {}
  };
  const startCtfExercise = async (exerciseId: string) => {
    setLoading(true); setCtfComplete(false); setCtfScore(0); setCtfStepResult(null);
    try {
      const r = await axios.post(`${API_URL}/api/ctf/start`, { exercise_id: exerciseId });
      setCtfActiveExercise({ ...r.data, _exerciseId: exerciseId });
      setCtfCurrentStep(r.data.current_step);
      setCtfStepIndex(0);
      setCtfView('play');
    } catch {}
    setLoading(false);
  };
  const executeCtfStep = async () => {
    if (!ctfActiveExercise) return;
    setLoading(true); setCtfStepResult(null);
    try {
      const r = await axios.post(`${API_URL}/api/ctf/execute`, { exercise_id: ctfActiveExercise._exerciseId, step_index: ctfStepIndex });
      setCtfStepResult(r.data);
      setCtfScore(prev => prev + (r.data.points_earned || 0));
      if (r.data.is_last_step) { setCtfComplete(true); }
    } catch {}
    setLoading(false);
  };
  const nextCtfStep = () => {
    if (ctfStepResult?.next_step) {
      setCtfCurrentStep(ctfStepResult.next_step);
      setCtfStepIndex(ctfStepResult.next_step.index);
      setCtfStepResult(null);
    }
  };

  const getDiffColor = (d: string) => {
    switch (d) { case 'BEGINNER': return '#3ddc84'; case 'INTERMEDIATE': return '#ffcc00'; case 'ADVANCED': return '#ff6600'; case 'EXPERT': return '#ff003c'; default: return '#888'; }
  };
  const getPhaseColor = (p: string) => {
    switch (p) {
      case 'RECONNAISSANCE': return '#00ccff'; case 'INITIAL ACCESS': return '#ff6600'; case 'PRIVILEGE ESCALATION': return '#ff003c';
      case 'PERSISTENCE': return '#aa00ff'; case 'LATERAL MOVEMENT': return '#ffcc00'; case 'EXFILTRATION': return '#ff0066';
      case 'CREDENTIAL ACCESS': return '#ff4444'; case 'DOMAIN ADMIN': return '#ff003c'; case 'ENUMERATION': return '#00ccff';
      case 'TARGET ANALYSIS': return '#00ccff'; case 'EXPLOIT DEVELOPMENT': return '#ff6600'; case 'EXPLOITATION': return '#ff003c';
      case 'DATA EXTRACTION': return '#ff0066'; case 'WEAPONIZE': return '#ff6600'; case 'DELIVERY': return '#ffcc00';
      case 'CREDENTIAL HARVEST': return '#ff4444'; case 'PIVOT': return '#aa00ff'; case 'OBJECTIVE': return '#3ddc84';
      default: return '#888';
    }
  };

  // ============ CTF Render ============
  const renderCtf = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => { if (ctfView !== 'list') { setCtfView('list'); setCtfActiveExercise(null); setCtfStepResult(null); setCtfComplete(false); } else setActiveTab('home'); }}>
          <Ionicons name="arrow-back" size={28} color="#ff6600" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="flag-checkered" size={24} color="#ff6600" />
          <Text style={[styles.eyeTitle, { color: '#ff6600' }]}>RED TEAM CTF</Text>
        </View>
        <TouchableOpacity onPress={() => setCtfView(ctfView === 'leaderboard' ? 'list' : 'leaderboard')}>
          <MaterialCommunityIcons name="trophy" size={24} color={ctfView === 'leaderboard' ? '#ffcc00' : '#ff660060'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* LEADERBOARD */}
        {ctfView === 'leaderboard' && ctfLeaderboard && (
          <>
            <Text style={[styles.sectionTitle, { color: '#ffcc00' }]}>LEADERBOARD</Text>
            {ctfLeaderboard.leaderboard.map((e: any) => (
              <View key={e.rank} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0805', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: e.rank <= 3 ? '#ffcc00' : '#333' }}>
                <Text style={{ color: e.rank <= 3 ? '#ffcc00' : '#888', fontSize: 18, fontWeight: 'bold', width: 30 }}>#{e.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{e.operator}</Text>
                  <Text style={{ color: '#888', fontSize: 10 }}>{e.exercises_completed} ejercicios | Mejor: {e.fastest_time}</Text>
                </View>
                <Text style={{ color: '#ff6600', fontSize: 16, fontWeight: 'bold' }}>{e.score}</Text>
              </View>
            ))}
          </>
        )}

        {/* EXERCISE LIST */}
        {ctfView === 'list' && (
          <>
            <View style={[styles.statsBar, { borderColor: '#ff660040' }]}>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#ff6600' }]}>{ctfExercises.length}</Text><Text style={[styles.statLabel, { color: '#ff9944' }]}>Ejercicios</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#ffcc00' }]}>1550</Text><Text style={[styles.statLabel, { color: '#ff9944' }]}>Puntos</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#3ddc84' }]}>4</Text><Text style={[styles.statLabel, { color: '#ff9944' }]}>Niveles</Text></View>
            </View>

            {ctfExercises.map((ex: any) => (
              <TouchableOpacity key={ex.id} onPress={() => startCtfExercise(ex.id)}
                style={{ backgroundColor: '#0d0805', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: getDiffColor(ex.difficulty) + '40', borderLeftWidth: 3, borderLeftColor: getDiffColor(ex.difficulty) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1 }}>{ex.name}</Text>
                  <View style={{ backgroundColor: getDiffColor(ex.difficulty), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#000', fontSize: 9, fontWeight: 'bold' }}>{ex.difficulty}</Text>
                  </View>
                </View>
                <Text style={{ color: '#999', fontSize: 11, marginBottom: 6 }}>{ex.description}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {ex.objectives.map((obj: string, i: number) => (
                    <View key={i} style={{ backgroundColor: '#ff660010', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#ff9944', fontSize: 9 }}>{obj}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#666', fontSize: 10 }}>{ex.category} | {ex.total_steps} pasos | {ex.estimated_time}</Text>
                  <Text style={{ color: '#ff6600', fontSize: 11, fontWeight: 'bold' }}>{ex.reward_points} pts</Text>
                </View>
              </TouchableOpacity>
            ))}
            {ctfExercises.length === 0 && <ActivityIndicator color="#ff6600" style={{ marginTop: 20 }} />}
          </>
        )}

        {/* ACTIVE EXERCISE - PLAY */}
        {ctfView === 'play' && ctfActiveExercise && (
          <>
            {/* Exercise header */}
            <View style={{ backgroundColor: '#0d0805', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ff660030', marginBottom: 10 }}>
              <Text style={{ color: '#ff6600', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>{ctfActiveExercise.exercise}</Text>
              <Text style={{ color: '#888', fontSize: 10 }}>Target: {ctfActiveExercise.target_network} | Score: {ctfScore}</Text>
              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, marginTop: 8 }}>
                <View style={{ height: 4, backgroundColor: '#ff6600', borderRadius: 2, width: `${((ctfStepIndex + (ctfStepResult ? 1 : 0)) / ctfActiveExercise.total_steps) * 100}%` }} />
              </View>
              <Text style={{ color: '#666', fontSize: 9, marginTop: 4 }}>Paso {ctfStepIndex + 1} de {ctfActiveExercise.total_steps}</Text>
            </View>

            {/* Mission Complete */}
            {ctfComplete && ctfStepResult && (
              <View style={{ backgroundColor: '#0d1a05', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#3ddc84', marginBottom: 12, alignItems: 'center' }}>
                <MaterialCommunityIcons name="trophy" size={48} color="#ffcc00" />
                <Text style={{ color: '#3ddc84', fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>MISION COMPLETA</Text>
                <Text style={{ color: '#ffcc00', fontSize: 16, marginTop: 4 }}>Puntuacion: {ctfStepResult.final_score}/{ctfStepResult.max_score}</Text>
                <Text style={{ color: '#ff6600', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>Grado: {ctfStepResult.grade}</Text>
                <TouchableOpacity onPress={() => { setCtfView('list'); setCtfActiveExercise(null); setCtfComplete(false); setCtfStepResult(null); }}
                  style={{ marginTop: 12, backgroundColor: '#ff6600', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
                  <Text style={{ color: '#000', fontWeight: 'bold' }}>VOLVER A EJERCICIOS</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Current step */}
            {!ctfComplete && ctfCurrentStep && (
              <>
                <View style={{ backgroundColor: getPhaseColor(ctfCurrentStep.phase) + '15', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: getPhaseColor(ctfCurrentStep.phase) + '40', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={{ backgroundColor: getPhaseColor(ctfCurrentStep.phase), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                      <Text style={{ color: '#000', fontSize: 9, fontWeight: 'bold' }}>{ctfCurrentStep.phase}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', flex: 1 }}>{ctfCurrentStep.title}</Text>
                  </View>
                  <Text style={{ color: '#ccc', fontSize: 11, marginBottom: 8 }}>{ctfCurrentStep.description}</Text>
                  <View style={{ backgroundColor: '#000', borderRadius: 6, padding: 8 }}>
                    <Text style={{ color: '#3ddc84', fontSize: 11, fontFamily: 'monospace' }}>$ {ctfCurrentStep.command_hint}</Text>
                  </View>
                </View>

                {/* Execute button */}
                {!ctfStepResult && (
                  <TouchableOpacity style={[styles.eyeButton, { backgroundColor: '#ff6600' }, loading && styles.buttonDisabled]} onPress={executeCtfStep} disabled={loading}>
                    {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="play" size={16} color="#000" /><Text style={styles.eyeButtonText}>EJECUTAR PASO</Text></>}
                  </TouchableOpacity>
                )}

                {/* Step result */}
                {ctfStepResult && !ctfComplete && (
                  <View style={{ backgroundColor: '#001a05', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#3ddc8440', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: '#3ddc84', fontSize: 13, fontWeight: 'bold' }}>EXITO</Text>
                      <Text style={{ color: '#ffcc00', fontSize: 12, fontWeight: 'bold' }}>+{ctfStepResult.points_earned} pts</Text>
                    </View>
                    <View style={{ backgroundColor: '#000', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                      <Text style={{ color: '#3ddc84', fontSize: 10, fontFamily: 'monospace' }}>{ctfStepResult.output}</Text>
                    </View>
                    <View style={{ backgroundColor: '#ff660010', borderRadius: 6, padding: 8, marginBottom: 10 }}>
                      <Text style={{ color: '#ff9944', fontSize: 10, fontWeight: 'bold' }}>Intel: {ctfStepResult.intel_gained}</Text>
                    </View>
                    <TouchableOpacity onPress={nextCtfStep} style={{ backgroundColor: '#ff6600', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}>
                      <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>SIGUIENTE PASO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={{ backgroundColor: '#ff660010', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#ff660030' }}>
          <Text style={{ color: '#ff9944', fontSize: 10, textAlign: 'center' }}>Todos los ejercicios son SIMULADOS - Fines educativos y auditorias</Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderHome = () => (
    <ScrollView style={styles.homeScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.logoContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={styles.logoText}>X=pi</Text>
          <TouchableOpacity onPress={() => setShowPlatforms(true)} data-testid="pirate-flag-btn"
            style={{ padding: 4 }}>
            <Text style={{ fontSize: 32 }}>🏴‍☠️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitleText}>by Carbi</Text>
        <Text style={styles.taglineText}>Cybersecurity Toolkit v8.0</Text>
      </View>

      {/* Training Platforms Modal */}
      <Modal visible={showPlatforms} transparent animationType="fade" onRequestClose={() => setShowPlatforms(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 }}
          activeOpacity={1} onPress={() => setShowPlatforms(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#0a0a0a', borderRadius: 16, borderWidth: 1, borderColor: '#ff003c40', overflow: 'hidden' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ff003c30', alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>🏴‍☠️</Text>
              <Text style={{ color: '#ff003c', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>TRAINING PLATFORMS</Text>
              <Text style={{ color: '#666', fontSize: 10 }}>Cybersecurity Learning Resources</Text>
            </View>
            <ScrollView style={{ maxHeight: 420, padding: 8 }}>
              {TRAINING_PLATFORMS.map((p, i) => (
                <TouchableOpacity key={i} onPress={() => { Linking.openURL(p.url); setShowPlatforms(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 2, borderRadius: 8, backgroundColor: '#111' }}>
                  <Text style={{ fontSize: 22, width: 36, textAlign: 'center' }}>{p.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ color: p.color, fontSize: 13, fontWeight: 'bold' }}>{p.name}</Text>
                    <Text style={{ color: '#888', fontSize: 10 }}>{p.desc}</Text>
                  </View>
                  <MaterialCommunityIcons name="open-in-new" size={14} color="#555" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowPlatforms(false)}
              style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#ff003c20', alignItems: 'center' }}>
              <Text style={{ color: '#ff003c', fontSize: 12, fontWeight: 'bold' }}>CERRAR</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.featuresGrid}>
        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('osint')}>
          <MaterialCommunityIcons name="account-search" size={28} color="#00ff88" />
          <Text style={styles.featureTitle}>OSINT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('password')}>
          <MaterialCommunityIcons name="shield-lock" size={28} color="#ff00ff" />
          <Text style={styles.featureTitle}>Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('website')}>
          <MaterialCommunityIcons name="web" size={28} color="#00ffff" />
          <Text style={styles.featureTitle}>Website</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureCard} onPress={() => setActiveTab('chat')}>
          <MaterialCommunityIcons name="robot" size={28} color="#ffff00" />
          <Text style={styles.featureTitle}>AI Chat</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.featureCardWide, { borderColor: '#ff6600' }]} onPress={() => setActiveTab('intel')}>
        <MaterialCommunityIcons name="shield-bug" size={32} color="#ff6600" />
        <View style={styles.wideCardText}>
          <Text style={styles.featureTitle}>Security Intel</Text>
          <Text style={styles.featureDesc}>CVE | Tech | DDoS Analysis</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.featureCardWide, { borderColor: '#00ff00' }]} onPress={() => setActiveTab('defense')}>
        <MaterialCommunityIcons name="shield-check" size={32} color="#00ff00" />
        <View style={styles.wideCardText}>
          <Text style={styles.featureTitle}>Defense Center</Text>
          <Text style={styles.featureDesc}>IP Rep | Firewall | Threats</Text>
        </View>
      </TouchableOpacity>

      {/* EL OJO DEL DIABLO - Featured Module */}
      <TouchableOpacity style={styles.eyeCard} onPress={() => setActiveTab('eye')}>
        <View style={styles.eyeCardContent}>
          <View style={styles.eyeIconSmall}>
            <MaterialCommunityIcons name="eye" size={40} color="#ff0000" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={styles.eyeCardTitle}>EL OJO DEL DIABLO</Text>
            <Text style={styles.eyeCardSubtitle}>Deep Search | Global Map | Breach Intel</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={styles.eyeCardStat}>195 Regions</Text>
          <Text style={styles.eyeCardStat}>55K+ Cameras</Text>
          <Text style={styles.eyeCardStat}>8.5M+ Breaches</Text>
        </View>
      </TouchableOpacity>

      {/* CELLULAR INTELLIGENCE MODULE */}
      <TouchableOpacity style={styles.cellCard} onPress={() => setActiveTab('cellular')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#0a1a2a' }]}>
            <MaterialCommunityIcons name="cellphone-wireless" size={36} color="#00ccff" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#00ccff' }]}>CELLULAR INTEL</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#0088bb' }]}>2G/3G/4G/5G | SDR Tools | SS7 | IMSI</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#00aadd' }]}>28+ Tools</Text>
          <Text style={[styles.eyeCardStat, { color: '#00aadd' }]}>19 SDR HW</Text>
          <Text style={[styles.eyeCardStat, { color: '#00aadd' }]}>12 Vectors</Text>
        </View>
      </TouchableOpacity>

      {/* SECRET SCANNER MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#ff4400', backgroundColor: '#1a0a00' }]} onPress={() => setActiveTab('secrets')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#2a1000' }]}>
            <MaterialCommunityIcons name="key-alert" size={36} color="#ff4400" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#ff4400' }]}>SECRET SCANNER</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#cc6633' }]}>KeyHacks | 68 Patrones | API Key Detection</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#ff6633' }]}>68 Regex</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff6633' }]}>25 KeyHacks</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff6633' }]}>9 Categorias</Text>
        </View>
      </TouchableOpacity>

      {/* GOOGLE DORKS MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#ffaa00', backgroundColor: '#1a1200' }]} onPress={() => setActiveTab('dorks')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#2a1a00' }]}>
            <MaterialCommunityIcons name="google" size={36} color="#ffaa00" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#ffaa00' }]}>GOOGLE DORKS</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#cc8800' }]}>GHDB | Operadores | Constructor Dorks</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#ffcc44' }]}>50 Dorks</Text>
          <Text style={[styles.eyeCardStat, { color: '#ffcc44' }]}>22 Operadores</Text>
          <Text style={[styles.eyeCardStat, { color: '#ffcc44' }]}>5 Tipos</Text>
        </View>
      </TouchableOpacity>

      {/* MEXICO OSINT v2 MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#00cc66', backgroundColor: '#001a0a' }]} onPress={() => setActiveTab('mexosint')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#002a10' }]}>
            <MaterialCommunityIcons name="map-marker-radius" size={36} color="#00cc66" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#00cc66' }]}>MEXICO OSINT v2</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#009944' }]}>32 Estados | CURP | RFC | Telecom | C.P.</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#00cc66' }]}>32 Estados</Text>
          <Text style={[styles.eyeCardStat, { color: '#00cc66' }]}>20 Ciudades</Text>
          <Text style={[styles.eyeCardStat, { color: '#00cc66' }]}>8 Telecom</Text>
        </View>
      </TouchableOpacity>

      {/* REAL APIS MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#00ddff', backgroundColor: '#001a22' }]} onPress={() => setActiveTab('realapis')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#002a33' }]}>
            <MaterialCommunityIcons name="api" size={36} color="#00ddff" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#00ddff' }]}>APIS REALES</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#0099bb' }]}>Shodan | Breach | SSL | Weather | SafeBrowse</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#00ddff' }]}>5 APIs Live</Text>
          <Text style={[styles.eyeCardStat, { color: '#00ddff' }]}>Datos Reales</Text>
          <Text style={[styles.eyeCardStat, { color: '#00ddff' }]}>En Vivo</Text>
        </View>
      </TouchableOpacity>

      {/* CYBER TOOLS MODULE - FUNCTIONAL */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#aa00ff', backgroundColor: '#1a001a' }]} onPress={() => setActiveTab('cybertools')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#2a002a' }]}>
            <MaterialCommunityIcons name="tools" size={36} color="#aa00ff" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#aa00ff' }]}>CYBER TOOLS</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#8800cc' }]}>Port Scan | DNS | WHOIS | Hash | Crack | Encode</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#cc44ff' }]}>14 Tools</Text>
          <Text style={[styles.eyeCardStat, { color: '#cc44ff' }]}>100% Real</Text>
          <Text style={[styles.eyeCardStat, { color: '#cc44ff' }]}>Funcional</Text>
        </View>
      </TouchableOpacity>

      {/* PENTESTING LAB MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#ff0066', backgroundColor: '#1a0016' }]} onPress={() => setActiveTab('pentest')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#2a0020' }]}>
            <MaterialCommunityIcons name="skull-crossbones" size={36} color="#ff0066" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#ff0066' }]}>PENTESTING LAB</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#cc0055' }]}>ians | Exploits | Trojans | Bruteforce | Recon</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#ff3388' }]}>6 Targets</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff3388' }]}>10 Exploits</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff3388' }]}>8 Trojans</Text>
        </View>
      </TouchableOpacity>

      {/* C2 MALWARE DASHBOARD MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#ff003c', backgroundColor: '#1a000d' }]} onPress={() => setActiveTab('c2')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#2a0015' }]}>
            <MaterialCommunityIcons name="skull" size={36} color="#ff003c" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#ff003c' }]}>C2 DASHBOARD</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#cc002e' }]}>Command & Control | Malware Lab | Multi-OS</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#ff335f' }]}>8 Agents</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff335f' }]}>16 Payloads</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff335f' }]}>4 Labs</Text>
        </View>
      </TouchableOpacity>

      {/* RED TEAM CTF MODULE */}
      <TouchableOpacity style={[styles.cellCard, { borderColor: '#ff6600', backgroundColor: '#1a0d00' }]} onPress={() => setActiveTab('ctf')}>
        <View style={styles.eyeCardContent}>
          <View style={[styles.eyeIconSmall, { backgroundColor: '#2a1500' }]}>
            <MaterialCommunityIcons name="flag-checkered" size={36} color="#ff6600" />
          </View>
          <View style={styles.eyeCardText}>
            <Text style={[styles.eyeCardTitle, { color: '#ff6600' }]}>RED TEAM CTF</Text>
            <Text style={[styles.eyeCardSubtitle, { color: '#cc5500' }]}>Ejercicios Guiados | Kill Chain | Gamificado</Text>
          </View>
        </View>
        <View style={styles.eyeCardStats}>
          <Text style={[styles.eyeCardStat, { color: '#ff8833' }]}>4 Misiones</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff8833' }]}>1550 Pts</Text>
          <Text style={[styles.eyeCardStat, { color: '#ff8833' }]}>Leaderboard</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.footerInline}>
        <Text style={styles.footerText}>X=pi by Carbi - v8.0</Text>
      </View>
    </ScrollView>
  );

  const renderEye = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ff0000" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="eye" size={24} color="#ff0000" />
          <Text style={styles.eyeTitle}>EL OJO DEL DIABLO</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Global Stats Bar */}
      {globalStats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{globalStats.regions_covered}</Text>
            <Text style={styles.statLabel}>Regions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(globalStats.total_breaches_found / 1000000).toFixed(1)}M</Text>
            <Text style={styles.statLabel}>Breaches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{globalStats.active_threats}</Text>
            <Text style={styles.statLabel}>Threats</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(cameraData?.total_cameras / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Cameras</Text>
          </View>
        </View>
      )}

      {/* Sub tabs */}
      <View style={styles.eyeSubTabs}>
        {(['search', 'map', 'breach', 'domain'] as EyeSubTab[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.eyeSubTab, eyeSubTab === tab && styles.eyeSubTabActive]} onPress={() => setEyeSubTab(tab)}>
            <MaterialCommunityIcons 
              name={tab === 'search' ? 'magnify' : tab === 'map' ? 'earth' : tab === 'breach' ? 'database-alert' : 'domain'} 
              size={18} 
              color={eyeSubTab === tab ? '#000' : '#ff0000'} 
            />
            <Text style={[styles.eyeSubTabText, eyeSubTab === tab && styles.eyeSubTabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.resultsContainer}>
        {/* DEEP SEARCH */}
        {eyeSubTab === 'search' && (
          <>
            <View style={styles.searchTypeRow}>
              {['all', 'email', 'username', 'domain', 'ip', 'phone'].map((type) => (
                <TouchableOpacity key={type} style={[styles.searchTypeBtn, searchType === type && styles.searchTypeBtnActive]} onPress={() => setSearchType(type)}>
                  <Text style={[styles.searchTypeText, searchType === type && styles.searchTypeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.eyeInputContainer}>
              <MaterialCommunityIcons name="magnify" size={24} color="#ff0000" />
              <TextInput style={styles.eyeInput} placeholder="Enter search query..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" />
            </View>

            <TouchableOpacity style={[styles.eyeButton, loading && styles.buttonDisabled]} onPress={deepSearch} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="eye-outline" size={20} color="#000" /><Text style={styles.eyeButtonText}>DEEP SEARCH</Text></>}
            </TouchableOpacity>

            {searchResult && (
              <View style={styles.eyeResultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>Results: {searchResult.total_results}</Text>
                  <Text style={styles.resultSources}>{searchResult.sources_searched} sources</Text>
                </View>

                {searchResult.results.map((result: any, i: number) => (
                  <View key={i} style={styles.resultItem}>
                    <View style={styles.resultItemHeader}>
                      <Text style={styles.resultSource}>{result.source}</Text>
                      <View style={[styles.confidenceBadge, { backgroundColor: result.confidence === 'high' ? '#00ff88' : result.confidence === 'medium' ? '#ffff00' : '#666' }]}>
                        <Text style={styles.confidenceText}>{result.confidence}</Text>
                      </View>
                    </View>
                    <Text style={styles.resultType}>{result.type}</Text>
                    {result.data && (
                      <View style={styles.resultData}>
                        {Object.entries(result.data).slice(0, 5).map(([key, value]: [string, any]) => (
                          <Text key={key} style={styles.resultDataItem}>{key}: {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value)}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {searchResult.geo_data.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Location Data</Text>
                    <WorldMap markers={searchResult.geo_data} />
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* GLOBAL MAP */}
        {eyeSubTab === 'map' && (
          <>
            <Text style={styles.sectionTitle}>Global Camera Network</Text>
            <Text style={styles.sectionSubtitle}>Public webcams from EarthCam, Webcams.travel & WorldCam</Text>
            
            {cameraData && (
              <>
                <WorldMap markers={cameraData.cameras.map((c: any) => ({ lat: c.lat, lon: c.lon, count: c.count, label: c.region }))} />
                
                <View style={styles.regionList}>
                  {cameraData.cameras.map((camera: any, i: number) => (
                    <View key={i} style={styles.regionCard}>
                      <View style={styles.regionHeader}>
                        <Text style={styles.regionName}>{camera.region}</Text>
                        <Text style={styles.regionCount}>{camera.count.toLocaleString()}</Text>
                      </View>
                      <View style={styles.regionTypes}>
                        {camera.types.map((type: string, j: number) => (
                          <View key={j} style={styles.typeTag}>
                            <Text style={styles.typeText}>{type}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.totalCameras}>
                  <MaterialCommunityIcons name="camera" size={24} color="#ff0000" />
                  <Text style={styles.totalText}>{cameraData.total_cameras.toLocaleString()} Public Cameras Indexed</Text>
                </View>
              </>
            )}
          </>
        )}

        {/* BREACH CHECK */}
        {eyeSubTab === 'breach' && (
          <>
            <View style={styles.eyeInputContainer}>
              <MaterialCommunityIcons name="email-alert" size={24} color="#ff0000" />
              <TextInput style={styles.eyeInput} placeholder="Enter email to check..." placeholderTextColor="#666" value={breachEmail} onChangeText={setBreachEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <TouchableOpacity style={[styles.eyeButton, loading && styles.buttonDisabled]} onPress={checkBreach} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="database-search" size={20} color="#000" /><Text style={styles.eyeButtonText}>CHECK BREACHES</Text></>}
            </TouchableOpacity>

            {breachResult && (
              <View style={styles.eyeResultCard}>
                <View style={styles.breachHeader}>
                  <MaterialCommunityIcons name={breachResult.is_breached ? "alert-circle" : "check-circle"} size={40} color={breachResult.is_breached ? "#ff0000" : "#00ff88"} />
                  <View style={styles.breachInfo}>
                    <Text style={[styles.breachStatus, { color: breachResult.is_breached ? '#ff0000' : '#00ff88' }]}>
                      {breachResult.is_breached ? 'BREACHED' : 'NO BREACHES FOUND'}
                    </Text>
                    <Text style={styles.breachEmail}>{breachResult.email}</Text>
                  </View>
                </View>

                {breachResult.is_breached && (
                  <>
                    <Text style={styles.breachCount}>Found in {breachResult.breach_count} breach(es)</Text>
                    
                    <Text style={styles.sectionTitle}>Exposed Data Types</Text>
                    <View style={styles.exposedData}>
                      {breachResult.exposed_data.map((data: string, i: number) => (
                        <View key={i} style={styles.exposedTag}>
                          <Text style={styles.exposedText}>{data}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.sectionTitle}>Breach Details</Text>
                    {breachResult.breaches.map((breach: any, i: number) => (
                      <View key={i} style={styles.breachCard}>
                        <Text style={styles.breachName}>{breach.name}</Text>
                        <Text style={styles.breachDate}>{breach.date}</Text>
                        <Text style={styles.breachRecords}>{breach.records_affected.toLocaleString()} records</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* DOMAIN INTEL */}
        {eyeSubTab === 'domain' && (
          <>
            <View style={styles.eyeInputContainer}>
              <MaterialCommunityIcons name="domain" size={24} color="#ff0000" />
              <TextInput style={styles.eyeInput} placeholder="Enter domain (e.g., google.com)..." placeholderTextColor="#666" value={domainQuery} onChangeText={setDomainQuery} autoCapitalize="none" />
            </View>

            <TouchableOpacity style={[styles.eyeButton, loading && styles.buttonDisabled]} onPress={getDomainIntel} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="magnify-scan" size={20} color="#000" /><Text style={styles.eyeButtonText}>ANALYZE DOMAIN</Text></>}
            </TouchableOpacity>

            {domainResult && (
              <View style={styles.eyeResultCard}>
                <Text style={styles.domainTitle}>{domainResult.domain}</Text>
                
                {domainResult.ip_addresses.length > 0 && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="ip-network" size={18} color="#ff0000" />
                    <Text style={styles.infoText}>IP: {domainResult.ip_addresses.join(', ')}</Text>
                  </View>
                )}

                {domainResult.geo_location.country && (
                  <>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <WorldMap markers={[{ lat: domainResult.geo_location.lat, lon: domainResult.geo_location.lon, label: domainResult.domain }]} />
                    <View style={styles.geoInfo}>
                      <Text style={styles.geoItem}>{domainResult.geo_location.city}, {domainResult.geo_location.country}</Text>
                      <Text style={styles.geoItem}>ISP: {domainResult.geo_location.isp}</Text>
                      <Text style={styles.geoItem}>Org: {domainResult.geo_location.org}</Text>
                    </View>
                  </>
                )}

                {domainResult.technologies.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Technologies</Text>
                    <View style={styles.techTags}>
                      {domainResult.technologies.map((tech: string, i: number) => (
                        <View key={i} style={styles.techTag}>
                          <Text style={styles.techText}>{tech}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.sectionTitle}>Subdomains</Text>
                {domainResult.subdomains.map((sub: string, i: number) => (
                  <Text key={i} style={styles.subdomain}>{sub}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderCellular = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#00ccff" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="cellphone-wireless" size={22} color="#00ccff" />
          <Text style={[styles.eyeTitle, { color: '#00ccff' }]}>CELLULAR INTEL</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Dashboard Stats */}
      {cellularDashboard && (
        <View style={[styles.statsBar, { borderColor: '#00ccff40' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00ccff' }]}>{cellularDashboard.total_tools}</Text>
            <Text style={[styles.statLabel, { color: '#0088bb' }]}>Tools</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00ccff' }]}>{cellularDashboard.total_hardware}</Text>
            <Text style={[styles.statLabel, { color: '#0088bb' }]}>Hardware</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00ccff' }]}>{cellularDashboard.total_attack_vectors}</Text>
            <Text style={[styles.statLabel, { color: '#0088bb' }]}>Vectors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00ccff' }]}>{cellularDashboard.total_research_papers}</Text>
            <Text style={[styles.statLabel, { color: '#0088bb' }]}>Papers</Text>
          </View>
        </View>
      )}

      {/* Sub tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 40 }}>
        {([
          { key: 'dashboard', icon: 'view-dashboard', label: 'DASH' },
          { key: 'tools', icon: 'tools', label: 'TOOLS' },
          { key: 'hardware', icon: 'chip', label: 'SDR HW' },
          { key: 'attacks', icon: 'shield-alert', label: 'VECTORS' },
          { key: 'scan', icon: 'radar', label: 'SCAN' },
          { key: 'mexico', icon: 'flag', label: 'MEXICO' },
        ] as { key: CellularSubTab; icon: string; label: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.cellSubTab, cellularSubTab === tab.key && styles.cellSubTabActive]}
            onPress={() => setCellularSubTab(tab.key)}
          >
            <MaterialCommunityIcons name={tab.icon as any} size={14} color={cellularSubTab === tab.key ? '#000' : '#00ccff'} />
            <Text style={[styles.cellSubTabText, cellularSubTab === tab.key && { color: '#000' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {/* DASHBOARD */}
        {cellularSubTab === 'dashboard' && cellularDashboard && (
          <>
            <Text style={[styles.sectionTitle, { color: '#00ccff' }]}>Severity Distribution</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 }}>
              {Object.entries(cellularDashboard.severity_distribution).map(([sev, count]: [string, any]) => (
                <View key={sev} style={{ alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: getSeverityColor(sev) + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: getSeverityColor(sev) }}>
                    <Text style={{ color: getSeverityColor(sev), fontWeight: 'bold', fontSize: 16 }}>{String(count)}</Text>
                  </View>
                  <Text style={{ color: '#888', fontSize: 8, marginTop: 4 }}>{sev}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: '#00ccff' }]}>Tool Categories</Text>
            {cellularDashboard.categories?.tools && Object.entries(cellularDashboard.categories.tools).map(([cat, count]: [string, any]) => (
              <View key={cat} style={styles.cellRow}>
                <Text style={{ color: '#ccc', fontSize: 12, flex: 1 }}>{cat}</Text>
                <View style={[styles.cellBadge, { backgroundColor: '#00ccff20' }]}>
                  <Text style={{ color: '#00ccff', fontSize: 11, fontWeight: 'bold' }}>{String(count)}</Text>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: '#00ccff', marginTop: 14 }]}>Hardware Manufacturers</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {cellularDashboard.categories?.hardware_manufacturers?.map((m: string) => (
                <View key={m} style={[styles.cellTag, { borderColor: '#00ccff40' }]}>
                  <Text style={{ color: '#00ccff', fontSize: 10 }}>{m}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cellInfoBox}>
              <MaterialCommunityIcons name="information" size={16} color="#00ccff" />
              <Text style={{ color: '#888', fontSize: 10, flex: 1, marginLeft: 8 }}>
                Based on Awesome-Cellular-Hacking by W00t3k. Educational and defensive use only.
              </Text>
            </View>
          </>
        )}

        {/* TOOLS */}
        {cellularSubTab === 'tools' && (
          <>
            <View style={[styles.eyeInputContainer, { borderColor: '#00ccff' }]}>
              <MaterialCommunityIcons name="magnify" size={20} color="#00ccff" />
              <TextInput style={styles.eyeInput} placeholder="Search tools..." placeholderTextColor="#666" value={toolSearch} onChangeText={setToolSearch} onSubmitEditing={() => { setCellularTools(null); loadCellularTools(); }} />
            </View>
            {cellularTools?.tools?.map((tool: any) => (
              <View key={tool.id} style={[styles.cellToolCard, { borderLeftColor: tool.risk_level === 'CRITICAL' ? '#ff0040' : tool.risk_level === 'HIGH' ? '#ff6600' : '#00ccff' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', flex: 1 }}>{tool.name}</Text>
                  <View style={[styles.cellBadge, { backgroundColor: getSeverityColor(tool.risk_level) + '30' }]}>
                    <Text style={{ color: getSeverityColor(tool.risk_level), fontSize: 9, fontWeight: 'bold' }}>{tool.risk_level}</Text>
                  </View>
                </View>
                <Text style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>{tool.category}</Text>
                <Text style={{ color: '#aaa', fontSize: 11, marginBottom: 6 }}>{tool.description}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {tool.tags.slice(0, 4).map((tag: string) => (
                    <View key={tag} style={[styles.cellTag, { borderColor: '#00ccff30' }]}>
                      <Text style={{ color: '#00ccff', fontSize: 8 }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {/* HARDWARE */}
        {cellularSubTab === 'hardware' && (
          <>
            <Text style={[styles.sectionTitle, { color: '#00ccff' }]}>SDR Hardware Database</Text>
            {cellularHardware?.hardware?.map((hw: any) => (
              <View key={hw.id} style={styles.cellHwCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{hw.name}</Text>
                    <Text style={{ color: '#00ccff', fontSize: 10 }}>{hw.manufacturer}</Text>
                  </View>
                  <Text style={{ color: '#00ff88', fontSize: 14, fontWeight: 'bold' }}>{hw.price}</Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  <View style={styles.cellHwRow}>
                    <Text style={styles.cellHwLabel}>Freq:</Text>
                    <Text style={styles.cellHwValue}>{hw.freq_range}</Text>
                  </View>
                  <View style={styles.cellHwRow}>
                    <Text style={styles.cellHwLabel}>BW:</Text>
                    <Text style={styles.cellHwValue}>{hw.bandwidth}</Text>
                  </View>
                  <View style={styles.cellHwRow}>
                    <Text style={styles.cellHwLabel}>CH:</Text>
                    <Text style={styles.cellHwValue}>{hw.channels}</Text>
                  </View>
                  <View style={styles.cellHwRow}>
                    <Text style={styles.cellHwLabel}>Use:</Text>
                    <Text style={styles.cellHwValue}>{hw.use_case}</Text>
                  </View>
                </View>
                <Text style={{ color: '#666', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>{hw.notes}</Text>
              </View>
            ))}
          </>
        )}

        {/* ATTACK VECTORS */}
        {cellularSubTab === 'attacks' && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#ff004040' }]}>
              <MaterialCommunityIcons name="alert" size={16} color="#ff0040" />
              <Text style={{ color: '#ff6666', fontSize: 10, flex: 1, marginLeft: 8 }}>
                EDUCATIONAL ONLY - For defensive security research
              </Text>
            </View>
            {cellularAttacks?.vectors?.map((atk: any) => (
              <View key={atk.id} style={[styles.cellAtkCard, { borderLeftColor: getSeverityColor(atk.severity) }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', flex: 1 }}>{atk.name}</Text>
                  <View style={[styles.cellBadge, { backgroundColor: getSeverityColor(atk.severity) + '30' }]}>
                    <Text style={{ color: getSeverityColor(atk.severity), fontSize: 9, fontWeight: 'bold' }}>{atk.severity}</Text>
                  </View>
                </View>
                <Text style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{atk.category} | {atk.generation.join(', ')}</Text>
                <Text style={{ color: '#aaa', fontSize: 11, marginBottom: 6 }}>{atk.description}</Text>
                
                <Text style={{ color: '#00ff88', fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>Defense:</Text>
                {atk.defense.slice(0, 3).map((d: string, i: number) => (
                  <Text key={i} style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>{'\u2022'} {d}</Text>
                ))}
                
                {atk.mexico_relevance && (
                  <View style={{ marginTop: 6, backgroundColor: '#ff000010', borderRadius: 4, padding: 6 }}>
                    <Text style={{ color: '#ff6666', fontSize: 9 }}>MX: {atk.mexico_relevance}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* CELLULAR SCAN */}
        {cellularSubTab === 'scan' && (
          <>
            <TouchableOpacity style={[styles.eyeButton, { backgroundColor: '#00ccff' }, loading && styles.buttonDisabled]} onPress={runCellularScan} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : (
                <>
                  <MaterialCommunityIcons name="radar" size={20} color="#000" />
                  <Text style={styles.eyeButtonText}>SCAN CELLULAR ENVIRONMENT</Text>
                </>
              )}
            </TouchableOpacity>

            {cellularScan && (
              <>
                <View style={[styles.cellScanHeader, { borderColor: cellularScan.threat_level === 'CRITICAL' ? '#ff0040' : cellularScan.threat_level === 'HIGH' ? '#ff6600' : '#00ff88' }]}>
                  <MaterialCommunityIcons name={cellularScan.suspicious_cells > 0 ? "alert-circle" : "check-circle"} size={32} color={cellularScan.suspicious_cells > 0 ? '#ff0040' : '#00ff88'} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: getSeverityColor(cellularScan.threat_level), fontSize: 16, fontWeight: 'bold' }}>
                      {cellularScan.threat_level}
                    </Text>
                    <Text style={{ color: '#888', fontSize: 11 }}>
                      {cellularScan.cells_found} cells | {cellularScan.suspicious_cells} suspicious
                    </Text>
                  </View>
                </View>

                {cellularScan.cells.map((cell: any, i: number) => (
                  <View key={i} style={[styles.cellScanItem, cell.suspicious && { borderColor: '#ff004060', backgroundColor: '#1a0a0a' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name={cell.suspicious ? "alert" : "antenna"} size={16} color={cell.suspicious ? '#ff0040' : '#00ccff'} />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{cell.technology}</Text>
                      </View>
                      <Text style={{ color: '#888', fontSize: 10 }}>{cell.operator}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: '#666', fontSize: 9 }}>Cell: {cell.cell_id}</Text>
                      <Text style={{ color: '#666', fontSize: 9 }}>{cell.frequency_mhz} MHz</Text>
                      <Text style={{ color: cell.signal_dbm > -85 ? '#00ff88' : cell.signal_dbm > -100 ? '#ffcc00' : '#ff4444', fontSize: 9, fontWeight: 'bold' }}>{cell.signal_dbm} dBm</Text>
                    </View>
                    {cell.suspicious && (
                      <Text style={{ color: '#ff4444', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>{cell.suspicious_reason}</Text>
                    )}
                  </View>
                ))}

                {cellularScan.recommendations.map((rec: string, i: number) => (
                  <Text key={i} style={{ color: '#888', fontSize: 10, marginTop: 4 }}>{rec}</Text>
                ))}
              </>
            )}
          </>
        )}

        {/* MEXICO TELECOM */}
        {cellularSubTab === 'mexico' && cellularMexico && (
          <>
            <Text style={[styles.sectionTitle, { color: '#00ccff' }]}>Mexican Operators</Text>
            {cellularMexico.operators.map((op: any, i: number) => (
              <View key={i} style={styles.cellMxOpCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{op.name}</Text>
                  <Text style={{ color: '#00ccff', fontSize: 12, fontWeight: 'bold' }}>{op.market_share}</Text>
                </View>
                <Text style={{ color: '#888', fontSize: 10 }}>{op.subscribers} subscribers</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {op.tech.map((t: string) => (
                    <View key={t} style={[styles.cellTag, { borderColor: t.includes('5G') ? '#00ff88' : '#00ccff30' }]}>
                      <Text style={{ color: t.includes('5G') ? '#00ff88' : '#00ccff', fontSize: 9 }}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: '#ff6666', fontSize: 9, marginTop: 4 }}>SS7: {op.ss7_status}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: '#00ccff', marginTop: 8 }]}>State Coverage</Text>
            {Object.entries(cellularMexico.state_coverage).map(([code, data]: [string, any]) => (
              <View key={code} style={styles.cellMxStateCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{code}</Text>
                  <View style={[styles.cellBadge, { backgroundColor: getSeverityColor(data.risk) + '30' }]}>
                    <Text style={{ color: getSeverityColor(data.risk), fontSize: 9, fontWeight: 'bold' }}>{data.risk}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: '#00ccff', fontSize: 10 }}>4G: {data['4g_coverage']}</Text>
                  <Text style={{ color: data['5g_coverage'] !== '0%' ? '#00ff88' : '#666', fontSize: 10 }}>5G: {data['5g_coverage']}</Text>
                </View>
                <Text style={{ color: '#888', fontSize: 9, marginTop: 4 }}>{data.notes}</Text>
              </View>
            ))}

            {cellularMexico.cert && (
              <View style={[styles.cellInfoBox, { borderColor: '#00ccff40', marginTop: 10 }]}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#00ccff" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{cellularMexico.cert.name}</Text>
                  <Text style={{ color: '#888', fontSize: 9 }}>{cellularMexico.cert.email}</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );

  // Simple render functions for other tabs
  // ========== SECRET SCANNER RENDER ==========
  const renderSecrets = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ff4400" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="key-alert" size={24} color="#ff4400" />
          <Text style={[styles.eyeTitle, { color: '#ff4400' }]}>SECRET SCANNER</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 36 }}>
        {([['scanner', 'SCANNER'], ['patterns', 'PATRONES'], ['keyhacks', 'KEYHACKS']] as [SecretsSubTab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.cellSubTab, secretsSubTab === key && { backgroundColor: '#ff4400' }]} onPress={() => setSecretsSubTab(key)}>
            <Text style={[styles.cellSubTabText, { color: secretsSubTab === key ? '#000' : '#ff4400' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {secretsSubTab === 'scanner' && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: '#111', borderWidth: 1, borderColor: '#ff4400', borderRadius: 10, padding: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 10 }]}
              placeholder="Pega texto, codigo o config para escanear secretos..."
              placeholderTextColor="#666"
              multiline
              value={secretScanText}
              onChangeText={setSecretScanText}
            />
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff4400' }, loading && styles.buttonDisabled]} onPress={scanSecrets} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="radar" size={20} color="#000" /><Text style={styles.scanButtonText}>ESCANEAR SECRETOS</Text></>}
            </TouchableOpacity>
            {secretScanResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ff440060' }]}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultTitle, { color: '#ff4400' }]}>Resultado: {secretScanResult.total_secrets_found} secretos</Text>
                </View>
                {Object.entries(secretScanResult.risk_summary).map(([risk, count]) => (
                  (count as number) > 0 && <View key={risk} style={[styles.cellBadge, { backgroundColor: getSeverityColor(risk) + '30', marginBottom: 4 }]}>
                    <Text style={{ color: getSeverityColor(risk), fontSize: 11, fontWeight: 'bold' }}>{risk}: {count as number}</Text>
                  </View>
                ))}
                {secretScanResult.matches.map((m: any, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 3, borderLeftColor: getSeverityColor(m.risk_level) }]}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{m.service}</Text>
                    <Text style={{ color: getSeverityColor(m.risk_level), fontSize: 10 }}>{m.risk_level} - {m.category}</Text>
                    <Text style={{ color: '#ff8866', fontSize: 11, fontFamily: 'monospace' }}>{m.matched_value}</Text>
                    <Text style={{ color: '#888', fontSize: 9, marginTop: 4 }}>Verificar: {m.verification_method}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {secretsSubTab === 'patterns' && secretPatterns && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#ff440020' }]}>
              <MaterialCommunityIcons name="database" size={20} color="#ff4400" />
              <Text style={{ color: '#ff4400', fontSize: 12, marginLeft: 8, fontWeight: 'bold' }}>{secretPatterns.total_patterns} patrones de deteccion</Text>
            </View>
            {Object.entries(secretPatterns.categories).map(([cat, patterns]) => (
              <View key={cat} style={{ marginTop: 12 }}>
                <Text style={[styles.sectionTitle, { color: '#ff4400' }]}>{cat}</Text>
                {(patterns as any[]).map((p: any, i: number) => (
                  <View key={i} style={[styles.cellToolCard, { borderLeftColor: getSeverityColor(p.risk) }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', flex: 1 }}>{p.service}</Text>
                      <View style={[styles.cellBadge, { backgroundColor: getSeverityColor(p.risk) + '30' }]}>
                        <Text style={{ color: getSeverityColor(p.risk), fontSize: 9, fontWeight: 'bold' }}>{p.risk}</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#888', fontSize: 9, marginTop: 4 }}>{p.verify}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
        {secretsSubTab === 'keyhacks' && keyhacksData && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#ff440020' }]}>
              <MaterialCommunityIcons name="key-chain" size={20} color="#ff4400" />
              <Text style={{ color: '#ff4400', fontSize: 12, marginLeft: 8, fontWeight: 'bold' }}>{keyhacksData.total_services} servicios - Verificacion de API keys</Text>
            </View>
            {keyhacksData.keyhacks.map((k: any, i: number) => (
              <View key={i} style={[styles.cellToolCard, { borderLeftColor: '#ff4400' }]}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{k.service}</Text>
                <Text style={{ color: '#ff8866', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>{k.verify_cmd}</Text>
                <Text style={{ color: '#888', fontSize: 9, marginTop: 2 }}>Exito: {k.success_indicator}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );

  // ========== GOOGLE DORKS RENDER ==========
  const renderDorks = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ffaa00" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="google" size={24} color="#ffaa00" />
          <Text style={[styles.eyeTitle, { color: '#ffaa00' }]}>GOOGLE DORKS</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 36 }}>
        {([['database', 'BASE DATOS'], ['operators', 'OPERADORES'], ['builder', 'CONSTRUCTOR']] as [DorksSubTab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.cellSubTab, dorksSubTab === key && { backgroundColor: '#ffaa00' }]} onPress={() => setDorksSubTab(key)}>
            <Text style={[styles.cellSubTabText, { color: dorksSubTab === key ? '#000' : '#ffaa00' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {dorksSubTab === 'database' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ffaa00' }]}>
              <MaterialCommunityIcons name="magnify" size={20} color="#ffaa00" />
              <TextInput style={styles.input} placeholder="Buscar dorks..." placeholderTextColor="#666" value={dorkSearchFilter} onChangeText={setDorkSearchFilter} onSubmitEditing={loadDorksDatabase} />
            </View>
            {dorksData && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, maxHeight: 30 }}>
                  <TouchableOpacity onPress={() => { setDorkCategoryFilter(''); }} style={[styles.cellTag, { borderColor: !dorkCategoryFilter ? '#ffaa00' : '#333' }]}>
                    <Text style={{ color: !dorkCategoryFilter ? '#ffaa00' : '#666', fontSize: 9 }}>Todos ({dorksData.total_dorks})</Text>
                  </TouchableOpacity>
                  {Object.entries(dorksData.categories).map(([cat, count]) => (
                    <TouchableOpacity key={cat} onPress={() => setDorkCategoryFilter(cat)} style={[styles.cellTag, { borderColor: dorkCategoryFilter === cat ? '#ffaa00' : '#333', marginLeft: 4 }]}>
                      <Text style={{ color: dorkCategoryFilter === cat ? '#ffaa00' : '#666', fontSize: 9 }}>{cat} ({count as number})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {dorksData.dorks.map((d: any, i: number) => (
                  <View key={i} style={[styles.cellToolCard, { borderLeftColor: getSeverityColor(d.risk) }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#888', fontSize: 9 }}>{d.id} - {d.category}</Text>
                      <View style={[styles.cellBadge, { backgroundColor: getSeverityColor(d.risk) + '30' }]}>
                        <Text style={{ color: getSeverityColor(d.risk), fontSize: 8, fontWeight: 'bold' }}>{d.risk}</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#ffcc44', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>{d.dork}</Text>
                    <Text style={{ color: '#aaa', fontSize: 10, marginTop: 2 }}>{d.description}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        {dorksSubTab === 'operators' && dorksOperators && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#ffaa0020' }]}>
              <MaterialCommunityIcons name="code-tags" size={20} color="#ffaa00" />
              <Text style={{ color: '#ffaa00', fontSize: 12, marginLeft: 8, fontWeight: 'bold' }}>{dorksOperators.total_operators} operadores avanzados</Text>
            </View>
            {dorksOperators.operators.map((op: any, i: number) => (
              <View key={i} style={[styles.cellToolCard, { borderLeftColor: '#ffaa00' }]}>
                <Text style={{ color: '#ffcc44', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' }}>{op.operator}</Text>
                <Text style={{ color: '#ccc', fontSize: 11, marginTop: 2 }}>{op.description}</Text>
                <Text style={{ color: '#888', fontSize: 10, marginTop: 2 }}>Sintaxis: {op.syntax}</Text>
                <Text style={{ color: '#ffaa00', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>Ej: {op.example}</Text>
              </View>
            ))}
          </>
        )}
        {dorksSubTab === 'builder' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ffaa00' }]}>
              <MaterialCommunityIcons name="target" size={20} color="#ffaa00" />
              <TextInput style={styles.input} placeholder="Dominio objetivo (ej: example.com)" placeholderTextColor="#666" value={dorkTarget} onChangeText={setDorkTarget} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, maxHeight: 30 }}>
              {['general', 'files', 'credentials', 'infrastructure', 'mexico'].map(t => (
                <TouchableOpacity key={t} onPress={() => setDorkType(t)} style={[styles.cellTag, { borderColor: dorkType === t ? '#ffaa00' : '#333', marginRight: 4 }]}>
                  <Text style={{ color: dorkType === t ? '#ffaa00' : '#666', fontSize: 10, textTransform: 'uppercase' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ffaa00' }, loading && styles.buttonDisabled]} onPress={buildDork} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="hammer-wrench" size={20} color="#000" /><Text style={styles.scanButtonText}>CONSTRUIR DORKS</Text></>}
            </TouchableOpacity>
            {dorkBuilderResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ffaa0060' }]}>
                <Text style={[styles.resultTitle, { color: '#ffaa00' }]}>Dorks para: {dorkBuilderResult.target}</Text>
                <Text style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>Tipo: {dorkBuilderResult.dork_type}</Text>
                {dorkBuilderResult.generated_dorks.map((d: string, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 2, borderLeftColor: '#ffaa00' }]}>
                    <Text style={{ color: '#ffcc44', fontSize: 11, fontFamily: 'monospace' }}>{d}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  // ========== MEXICO OSINT v2 RENDER ==========
  const renderMexOsint = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#00cc66" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="map-marker-radius" size={24} color="#00cc66" />
          <Text style={[styles.eyeTitle, { color: '#00cc66' }]}>MEXICO OSINT v2</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 36 }}>
        {([['dashboard', 'PANEL'], ['states', 'ESTADOS'], ['cities', 'CIUDADES'], ['zipcode', 'C.P.'], ['curp', 'CURP'], ['telecom', 'TELECOM']] as [MexSubTab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.cellSubTab, mexSubTab === key && { backgroundColor: '#00cc66' }]} onPress={() => setMexSubTab(key)}>
            <Text style={[styles.cellSubTabText, { color: mexSubTab === key ? '#000' : '#00cc66' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {mexSubTab === 'dashboard' && mexDashboard && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00cc6620' }]}>
              <MaterialCommunityIcons name="flag" size={24} color="#00cc66" />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: '#00cc66', fontSize: 14, fontWeight: 'bold' }}>Mexico OSINT v2</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>Datos completos de la Republica Mexicana</Text>
              </View>
            </View>
            {Object.entries(mexDashboard.available_data).map(([key, val]) => (
              <View key={key} style={[styles.cellRow, { borderBottomColor: '#1a1a1a' }]}>
                <Text style={{ color: '#ccc', fontSize: 12, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Text>
                <Text style={{ color: '#00cc66', fontSize: 14, fontWeight: 'bold' }}>{val as number}</Text>
              </View>
            ))}
            {mexDashboard.tools.map((t: any, i: number) => (
              <View key={i} style={[styles.cellToolCard, { borderLeftColor: '#00cc66' }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{t.name}</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>{t.description}</Text>
              </View>
            ))}
          </>
        )}
        {mexSubTab === 'states' && mexStates && (
          <>
            <Text style={{ color: '#00cc66', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>{mexStates.total_states} Estados</Text>
            {mexStates.states.map((s: any, i: number) => (
              <View key={i} style={[styles.cellMxStateCard, { borderColor: '#00cc6620' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{s.name}</Text>
                  <Text style={{ color: '#00cc66', fontSize: 10, fontWeight: 'bold' }}>{s.code}</Text>
                </View>
                <Text style={{ color: '#888', fontSize: 10 }}>Capital: {s.capital} | Region: {s.region}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>Poblacion: {(s.population).toLocaleString()} | Area: {s.area_km2.toLocaleString()} km2 | LADA: {s.phone_code}</Text>
              </View>
            ))}
          </>
        )}
        {mexSubTab === 'cities' && mexCities && (
          <>
            <Text style={{ color: '#00cc66', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>{mexCities.total_cities} Ciudades Principales</Text>
            {mexCities.cities.map((c: any, i: number) => (
              <View key={i} style={[styles.cellMxStateCard, { borderColor: '#00cc6620' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{c.name}</Text>
                  <View style={[styles.cellTag, { borderColor: '#00cc66' }]}>
                    <Text style={{ color: '#00cc66', fontSize: 8 }}>{c.type}</Text>
                  </View>
                </View>
                <Text style={{ color: '#888', fontSize: 10 }}>Estado: {c.state} | Pob: {c.population.toLocaleString()}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>Coords: {c.lat}, {c.lon} | Elevacion: {c.elevation_m}m</Text>
              </View>
            ))}
          </>
        )}
        {mexSubTab === 'zipcode' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#00cc66' }]}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#00cc66" />
              <TextInput style={styles.input} placeholder="Codigo Postal (ej: 06600)" placeholderTextColor="#666" value={mexZipInput} onChangeText={setMexZipInput} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00cc66' }, loading && styles.buttonDisabled]} onPress={lookupMexZip} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>BUSCAR C.P.</Text>}
            </TouchableOpacity>
            {mexZipResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#00cc6660' }]}>
                <Text style={[styles.resultTitle, { color: '#00cc66' }]}>CP {mexZipResult.zip_code}</Text>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{mexZipResult.state.name}</Text>
                <Text style={{ color: '#888', fontSize: 11 }}>Capital: {mexZipResult.state.capital} | Region: {mexZipResult.state.region}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>Rango CP del estado: {mexZipResult.zip_range.min} - {mexZipResult.zip_range.max}</Text>
                {mexZipResult.nearby_cities.length > 0 && (
                  <>
                    <Text style={{ color: '#00cc66', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>Ciudades cercanas:</Text>
                    {mexZipResult.nearby_cities.map((c: any, i: number) => (
                      <Text key={i} style={{ color: '#ccc', fontSize: 10 }}>{c.name} (Pob: {c.population.toLocaleString()})</Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </>
        )}
        {mexSubTab === 'curp' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#00cc66' }]}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#00cc66" />
              <TextInput style={styles.input} placeholder="CURP (18 caracteres)" placeholderTextColor="#666" value={mexCurpInput} onChangeText={setMexCurpInput} autoCapitalize="characters" maxLength={18} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00cc66' }, loading && styles.buttonDisabled]} onPress={validateCurp} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>VALIDAR CURP</Text>}
            </TouchableOpacity>
            {mexCurpResult && (
              <View style={[styles.eyeResultCard, { borderColor: mexCurpResult.valid ? '#00cc6660' : '#ff000060' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <MaterialCommunityIcons name={mexCurpResult.valid ? 'check-circle' : 'close-circle'} size={24} color={mexCurpResult.valid ? '#00cc66' : '#ff0000'} />
                  <Text style={{ color: mexCurpResult.valid ? '#00cc66' : '#ff0000', fontSize: 16, fontWeight: 'bold' }}>{mexCurpResult.valid ? 'VALIDO' : 'INVALIDO'}</Text>
                </View>
                {mexCurpResult.valid && mexCurpResult.decoded && (
                  <>
                    <View style={styles.cellRow}><Text style={{ color: '#888', fontSize: 11 }}>Iniciales</Text><Text style={{ color: '#fff', fontSize: 12 }}>{mexCurpResult.decoded.initials}</Text></View>
                    <View style={styles.cellRow}><Text style={{ color: '#888', fontSize: 11 }}>Fecha Nacimiento</Text><Text style={{ color: '#fff', fontSize: 12 }}>{mexCurpResult.decoded.birth_date}</Text></View>
                    <View style={styles.cellRow}><Text style={{ color: '#888', fontSize: 11 }}>Sexo</Text><Text style={{ color: '#fff', fontSize: 12 }}>{mexCurpResult.decoded.sex}</Text></View>
                    <View style={styles.cellRow}><Text style={{ color: '#888', fontSize: 11 }}>Estado</Text><Text style={{ color: '#fff', fontSize: 12 }}>{mexCurpResult.decoded.state_of_birth}</Text></View>
                  </>
                )}
                {mexCurpResult.error && <Text style={{ color: '#ff4444', fontSize: 11 }}>{mexCurpResult.error}</Text>}
              </View>
            )}
          </>
        )}
        {mexSubTab === 'telecom' && mexTelecom && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00cc6620' }]}>
              <MaterialCommunityIcons name="cellphone" size={20} color="#00cc66" />
              <Text style={{ color: '#00cc66', fontSize: 12, marginLeft: 8, fontWeight: 'bold' }}>{mexTelecom.total_operators} operadores | Codigo: {mexTelecom.phone_format.country_code}</Text>
            </View>
            {mexTelecom.operators.map((op: any, i: number) => (
              <View key={i} style={[styles.cellMxOpCard, { borderColor: '#00cc6620' }]}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{op.name}</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>Tipo: {op.type} | Mercado: {op.market_share}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>Tech: {op.technology} | Cobertura: {op.coverage}</Text>
              </View>
            ))}
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: '#00cc66', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>Codigos LADA</Text>
              {Object.entries(mexTelecom.phone_format.lada_codes).slice(0, 15).map(([code, state]) => (
                <View key={code} style={styles.cellRow}>
                  <Text style={{ color: '#00cc66', fontSize: 11, fontWeight: 'bold' }}>{code}</Text>
                  <Text style={{ color: '#ccc', fontSize: 11 }}>{state as string}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );

  // ========== REAL APIs RENDER ==========
  const renderRealApis = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#00ddff" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="api" size={24} color="#00ddff" />
          <Text style={[styles.eyeTitle, { color: '#00ddff' }]}>APIS REALES</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 36 }}>
        {([['shodan', 'SHODAN'], ['breach', 'BREACH'], ['ssl', 'SSL/TLS'], ['weather', 'CLIMA'], ['safebrowsing', 'SAFE BROWSE']] as [RealSubTab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.cellSubTab, realSubTab === key && { backgroundColor: '#00ddff' }]} onPress={() => setRealSubTab(key)}>
            <Text style={[styles.cellSubTabText, { color: realSubTab === key ? '#000' : '#00ddff' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {realSubTab === 'shodan' && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00ddff20', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="server-network" size={20} color="#00ddff" />
              <Text style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>Shodan InternetDB - Datos reales de IPs expuestas</Text>
            </View>
            <View style={[styles.inputContainer, { borderColor: '#00ddff' }]}>
              <MaterialCommunityIcons name="ip-network" size={20} color="#00ddff" />
              <TextInput style={styles.input} placeholder="IP Address (ej: 8.8.8.8)" placeholderTextColor="#666" value={shodanIp} onChangeText={setShodanIp} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ddff' }, loading && styles.buttonDisabled]} onPress={shodanLookup} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="magnify" size={20} color="#000" /><Text style={styles.scanButtonText}>BUSCAR EN SHODAN</Text></>}
            </TouchableOpacity>
            {shodanResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#00ddff60' }]}>
                <Text style={[styles.resultTitle, { color: '#00ddff' }]}>IP: {shodanResult.ip || shodanIp}</Text>
                {shodanResult.geolocation && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ color: '#ccc', fontSize: 11 }}>{shodanResult.geolocation.city}, {shodanResult.geolocation.region}, {shodanResult.geolocation.country}</Text>
                    <Text style={{ color: '#888', fontSize: 10 }}>ISP: {shodanResult.network?.isp}</Text>
                    <Text style={{ color: '#888', fontSize: 10 }}>ASN: {shodanResult.network?.asn}</Text>
                  </View>
                )}
                {shodanResult.security && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {shodanResult.security.is_proxy && <View style={[styles.cellBadge, { backgroundColor: '#ff440030' }]}><Text style={{ color: '#ff4400', fontSize: 9 }}>PROXY</Text></View>}
                    {shodanResult.security.is_hosting && <View style={[styles.cellBadge, { backgroundColor: '#ffaa0030' }]}><Text style={{ color: '#ffaa00', fontSize: 9 }}>HOSTING</Text></View>}
                    {shodanResult.security.is_mobile && <View style={[styles.cellBadge, { backgroundColor: '#00cc6630' }]}><Text style={{ color: '#00cc66', fontSize: 9 }}>MOBILE</Text></View>}
                  </View>
                )}
                {shodanResult.shodan_data?.open_ports?.length > 0 && (
                  <>
                    <Text style={{ color: '#00ddff', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>Puertos abiertos:</Text>
                    <Text style={{ color: '#ccc', fontSize: 10 }}>{shodanResult.shodan_data.open_ports.join(', ')}</Text>
                  </>
                )}
                {shodanResult.shodan_data?.vulns?.length > 0 && (
                  <>
                    <Text style={{ color: '#ff4444', fontSize: 11, fontWeight: 'bold', marginTop: 6 }}>Vulnerabilidades:</Text>
                    {shodanResult.shodan_data.vulns.map((v: string, i: number) => (
                      <Text key={i} style={{ color: '#ff6666', fontSize: 10 }}>{v}</Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </>
        )}
        {realSubTab === 'breach' && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00ddff20', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="shield-alert" size={20} color="#ff4444" />
              <Text style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>HaveIBeenPwned - Verificar filtraciones reales</Text>
            </View>
            <View style={[styles.inputContainer, { borderColor: '#ff4444' }]}>
              <MaterialCommunityIcons name="email" size={20} color="#ff4444" />
              <TextInput style={styles.input} placeholder="Email para verificar..." placeholderTextColor="#666" value={realBreachEmail} onChangeText={setRealBreachEmail} keyboardType="email-address" />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff4444' }, loading && styles.buttonDisabled]} onPress={realBreachCheck} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>VERIFICAR BREACH</Text>}
            </TouchableOpacity>
            {realBreachResult && (
              <View style={[styles.eyeResultCard, { borderColor: realBreachResult.found_in_breaches ? '#ff000060' : '#00ff0060' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={realBreachResult.found_in_breaches ? 'alert-circle' : 'check-circle'} size={24} color={realBreachResult.found_in_breaches ? '#ff0000' : '#00ff88'} />
                  <Text style={{ color: realBreachResult.found_in_breaches ? '#ff0000' : '#00ff88', fontSize: 16, fontWeight: 'bold' }}>{realBreachResult.found_in_breaches ? 'COMPROMETIDO' : 'SEGURO'}</Text>
                </View>
                <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>Email: {realBreachResult.email}</Text>
                {realBreachResult.found_in_breaches && (
                  <>
                    <Text style={{ color: '#ff6666', fontSize: 12, marginTop: 4 }}>Encontrado {realBreachResult.breach_count} veces en filtraciones</Text>
                    <View style={[styles.cellBadge, { backgroundColor: getSeverityColor(realBreachResult.risk_level) + '30', marginTop: 6 }]}>
                      <Text style={{ color: getSeverityColor(realBreachResult.risk_level), fontSize: 11, fontWeight: 'bold' }}>Riesgo: {realBreachResult.risk_level}</Text>
                    </View>
                  </>
                )}
                <Text style={{ color: '#888', fontSize: 10, marginTop: 6 }}>{realBreachResult.recommendation}</Text>
              </View>
            )}
          </>
        )}
        {realSubTab === 'ssl' && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00ddff20', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="lock" size={20} color="#00cc66" />
              <Text style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>Verificar certificado SSL/TLS de un dominio</Text>
            </View>
            <View style={[styles.inputContainer, { borderColor: '#00cc66' }]}>
              <MaterialCommunityIcons name="web" size={20} color="#00cc66" />
              <TextInput style={styles.input} placeholder="Dominio (ej: google.com)" placeholderTextColor="#666" value={sslDomain} onChangeText={setSslDomain} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00cc66' }, loading && styles.buttonDisabled]} onPress={checkSSL} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>VERIFICAR SSL</Text>}
            </TouchableOpacity>
            {sslResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#00cc6660' }]}>
                <Text style={[styles.resultTitle, { color: '#00cc66' }]}>SSL: {sslResult.domain || sslDomain}</Text>
                {sslResult.issuer && <Text style={{ color: '#ccc', fontSize: 11 }}>Emisor: {typeof sslResult.issuer === 'string' ? sslResult.issuer : JSON.stringify(sslResult.issuer)}</Text>}
                {sslResult.valid_until && <Text style={{ color: '#888', fontSize: 10 }}>Valido hasta: {sslResult.valid_until}</Text>}
                {sslResult.protocol && <Text style={{ color: '#666', fontSize: 10 }}>Protocolo: {sslResult.protocol}</Text>}
                {sslResult.valid !== undefined && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <MaterialCommunityIcons name={sslResult.valid ? 'check-circle' : 'close-circle'} size={18} color={sslResult.valid ? '#00cc66' : '#ff0000'} />
                    <Text style={{ color: sslResult.valid ? '#00cc66' : '#ff0000', fontSize: 12, fontWeight: 'bold' }}>{sslResult.valid ? 'VALIDO' : 'INVALIDO'}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
        {realSubTab === 'weather' && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00ddff20', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color="#ffcc00" />
              <Text style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>API meteorologica en tiempo real</Text>
            </View>
            <View style={[styles.inputContainer, { borderColor: '#ffcc00' }]}>
              <MaterialCommunityIcons name="city" size={20} color="#ffcc00" />
              <TextInput style={styles.input} placeholder="Ciudad (ej: Mexico City)" placeholderTextColor="#666" value={weatherCity} onChangeText={setWeatherCity} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ffcc00' }, loading && styles.buttonDisabled]} onPress={checkWeather} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>CONSULTAR CLIMA</Text>}
            </TouchableOpacity>
            {weatherResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ffcc0060' }]}>
                <Text style={[styles.resultTitle, { color: '#ffcc00' }]}>{weatherCity}</Text>
                {weatherResult.current && (
                  <>
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{weatherResult.current.temperature_c}°C</Text>
                    <Text style={{ color: '#888', fontSize: 11 }}>Humedad: {weatherResult.current.humidity}%</Text>
                    <Text style={{ color: '#888', fontSize: 11 }}>Viento: {weatherResult.current.wind_speed_kmh} km/h</Text>
                  </>
                )}
                {weatherResult.timezone && <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>Zona: {weatherResult.timezone}</Text>}
                <Text style={{ color: '#00ddff', fontSize: 9, marginTop: 4 }}>Datos en vivo - Open-Meteo API</Text>
              </View>
            )}
          </>
        )}
        {realSubTab === 'safebrowsing' && (
          <>
            <View style={[styles.cellInfoBox, { borderColor: '#00ddff20', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="google" size={20} color="#4285f4" />
              <Text style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>Google Safe Browsing - Detectar URLs maliciosas</Text>
            </View>
            <View style={[styles.inputContainer, { borderColor: '#4285f4' }]}>
              <MaterialCommunityIcons name="link-lock" size={20} color="#4285f4" />
              <TextInput style={styles.input} placeholder="URL a verificar..." placeholderTextColor="#666" value={safeBrowsingUrl} onChangeText={setSafeBrowsingUrl} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#4285f4' }, loading && styles.buttonDisabled]} onPress={checkSafeBrowsing} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>VERIFICAR URL</Text>}
            </TouchableOpacity>
            {safeBrowsingResult && (
              <View style={[styles.eyeResultCard, { borderColor: safeBrowsingResult.safe ? '#00ff0060' : '#ff000060' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={safeBrowsingResult.safe ? 'check-circle' : 'alert-circle'} size={24} color={safeBrowsingResult.safe ? '#00ff88' : '#ff0000'} />
                  <Text style={{ color: safeBrowsingResult.safe ? '#00ff88' : '#ff0000', fontSize: 16, fontWeight: 'bold' }}>{safeBrowsingResult.status || (safeBrowsingResult.safe ? 'SEGURO' : 'PELIGROSO')}</Text>
                </View>
                <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>URL: {safeBrowsingResult.url}</Text>
                {safeBrowsingResult.checked_against && (
                  <Text style={{ color: '#666', fontSize: 9, marginTop: 4 }}>Verificado contra: {safeBrowsingResult.checked_against.join(', ')}</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );


  // ========== PENTESTING LAB RENDER ==========
  const renderPentest = () => (
    <View style={styles.tabContent}>
      <View style={styles.eyeHeader}>
        <TouchableOpacity onPress={() => setActiveTab('home')}>
          <Ionicons name="arrow-back" size={28} color="#ff0066" />
        </TouchableOpacity>
        <View style={styles.eyeTitleContainer}>
          <MaterialCommunityIcons name="skull-crossbones" size={24} color="#ff0066" />
          <Text style={[styles.eyeTitle, { color: '#ff0066' }]}>PENTESTING LAB</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 36 }}>
        {([['dashboard', 'LAB'], ['portscan', 'PUERTOS'], ['sniffer', 'SNIFFER'], ['bruteforce', 'BRUTE'], ['exploits', 'EXPLOITS'], ['trojans', 'TROJANS'], ['sitemap', 'SITEMAP'], ['recon', 'RECON']] as [PentestSubTab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.cellSubTab, pentestSubTab === key && { backgroundColor: '#ff0066' }]} onPress={() => setPentestSubTab(key)}>
            <Text style={[styles.cellSubTabText, { color: pentestSubTab === key ? '#000' : '#ff0066' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {pentestSubTab === 'dashboard' && (
          <>
            {pentestDash && (
              <View style={[styles.cellInfoBox, { borderColor: '#ff006620' }]}>
                <MaterialCommunityIcons name="skull-crossbones" size={24} color="#ff0066" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ color: '#ff0066', fontSize: 14, fontWeight: 'bold' }}>Pentesting Lab (ians)</Text>
                  <Text style={{ color: '#888', fontSize: 9 }}>Entorno simulado - No se realizan ataques reales</Text>
                </View>
              </View>
            )}
            {pentestDash && Object.entries(pentestDash.lab_stats).map(([key, val]) => (
              <View key={key} style={[styles.cellRow, { borderBottomColor: '#1a1a1a' }]}>
                <Text style={{ color: '#ccc', fontSize: 12, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Text>
                <Text style={{ color: '#ff0066', fontSize: 14, fontWeight: 'bold' }}>{val as number}</Text>
              </View>
            ))}
            {labTargets && labTargets.targets.map((t: any, i: number) => (
              <View key={i} style={[styles.cellToolCard, { borderLeftColor: t.vulnerabilities > 0 ? '#ff0040' : '#00cc66' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{t.name}</Text>
                  <View style={[styles.cellBadge, { backgroundColor: '#00ff0030' }]}>
                    <Text style={{ color: '#00ff88', fontSize: 8 }}>{t.status}</Text>
                  </View>
                </View>
                <Text style={{ color: '#888', fontSize: 10 }}>{t.ip} | {t.os} | {t.role}</Text>
                <Text style={{ color: '#ff6644', fontSize: 10 }}>{t.open_ports} puertos | {t.vulnerabilities} vulns</Text>
              </View>
            ))}
          </>
        )}
        {pentestSubTab === 'portscan' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff0066' }]}>
              <MaterialCommunityIcons name="lan" size={20} color="#ff0066" />
              <TextInput style={styles.input} placeholder="Target (ej: lab-web-01)" placeholderTextColor="#666" value={portScanTarget} onChangeText={setPortScanTarget} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={runPortScan} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="radar" size={20} color="#000" /><Text style={styles.scanButtonText}>ESCANEAR PUERTOS</Text></>}
            </TouchableOpacity>
            {portScanResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ff006660' }]}>
                <Text style={[styles.resultTitle, { color: '#ff0066' }]}>Scan: {portScanResult.target}</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>OS: {portScanResult.os_detection} | {portScanResult.scan_time_seconds}s</Text>
                <Text style={{ color: '#ff0066', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>{portScanResult.open_ports} abiertos | {portScanResult.filtered_ports} filtrados</Text>
                {portScanResult.services.map((s: any, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 2, borderLeftColor: s.state === 'open' ? '#ff0066' : '#333' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 11 }}>{s.port}/{s.service}</Text>
                      <Text style={{ color: s.state === 'open' ? '#ff0066' : '#666', fontSize: 10 }}>{s.state}</Text>
                    </View>
                    <Text style={{ color: '#888', fontSize: 9 }}>{s.version}</Text>
                    {s.vuln && <Text style={{ color: '#ff4444', fontSize: 9 }}>{s.vuln}</Text>}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {pentestSubTab === 'sniffer' && (
          <>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={runSniffer} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="access-point-network" size={20} color="#000" /><Text style={styles.scanButtonText}>CAPTURAR PAQUETES</Text></>}
            </TouchableOpacity>
            {snifferResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ff006660' }]}>
                <Text style={[styles.resultTitle, { color: '#ff0066' }]}>{snifferResult.total_packets} Paquetes</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>Sospechosos: {snifferResult.suspicious_packets}</Text>
                {snifferResult.packets.slice(0, 12).map((p: any, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 1, borderLeftColor: '#ff006640' }]}>
                    <Text style={{ color: '#ff6688', fontSize: 9, fontFamily: 'monospace' }}>{p.protocol} {p.source} → {p.destination}</Text>
                    <Text style={{ color: '#666', fontSize: 8 }} numberOfLines={1}>{p.info}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {pentestSubTab === 'bruteforce' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff0066' }]}>
              <MaterialCommunityIcons name="server" size={20} color="#ff0066" />
              <TextInput style={styles.input} placeholder="Target (ej: lab-web-01)" placeholderTextColor="#666" value={bruteTarget} onChangeText={setBruteTarget} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={runBruteforce} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="key" size={20} color="#000" /><Text style={styles.scanButtonText}>SSH BRUTEFORCE</Text></>}
            </TouchableOpacity>
            {bruteResult && (
              <View style={[styles.eyeResultCard, { borderColor: bruteResult.success ? '#00ff0060' : '#ff000060' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={bruteResult.success ? 'check-circle' : 'close-circle'} size={24} color={bruteResult.success ? '#00ff88' : '#ff4444'} />
                  <Text style={{ color: bruteResult.success ? '#00ff88' : '#ff4444', fontSize: 14, fontWeight: 'bold' }}>{bruteResult.success ? 'ACCESO' : 'FALLIDO'}</Text>
                </View>
                {bruteResult.found_credentials && <Text style={{ color: '#00ff88', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>{bruteResult.found_credentials}</Text>}
                <Text style={{ color: '#888', fontSize: 10 }}>{bruteResult.total_attempts} intentos</Text>
                {bruteResult.recommendations && bruteResult.recommendations.slice(0, 3).map((r: string, i: number) => (
                  <Text key={i} style={{ color: '#ffaa00', fontSize: 9, marginTop: 2 }}>- {r}</Text>
                ))}
              </View>
            )}
          </>
        )}
        {pentestSubTab === 'exploits' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff0066' }]}>
              <MaterialCommunityIcons name="bug" size={20} color="#ff0066" />
              <TextInput style={styles.input} placeholder="Target (ej: lab-web-01)" placeholderTextColor="#666" value={exploitTarget} onChangeText={setExploitTarget} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={() => runExploit()} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="flash" size={20} color="#000" /><Text style={styles.scanButtonText}>EJECUTAR EXPLOIT</Text></>}
            </TouchableOpacity>
            {exploitResult && (
              <View style={[styles.eyeResultCard, { borderColor: exploitResult.success ? '#00ff0060' : '#ff000060' }]}>
                <Text style={{ color: exploitResult.success ? '#00ff88' : '#ff4444', fontSize: 14, fontWeight: 'bold' }}>{exploitResult.success ? 'EXPLOIT EXITOSO' : 'FALLIDO'}</Text>
                <Text style={{ color: '#ff6688', fontSize: 10 }}>{exploitResult.exploit.name} ({exploitResult.exploit.cve})</Text>
                {exploitResult.steps.map((s: any, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 2, borderLeftColor: s.status === 'DONE' || s.status === 'SUCCESS' ? '#00ff88' : '#ff4444' }]}>
                    <Text style={{ color: '#ccc', fontSize: 9 }}>{s.step}. {s.action}: {s.detail}</Text>
                  </View>
                ))}
              </View>
            )}
            {exploitsDb && exploitsDb.exploits.map((e: any, i: number) => (
              <TouchableOpacity key={i} style={[styles.cellToolCard, { borderLeftColor: getSeverityColor(e.severity) }]} onPress={() => { setExploitTarget(e.target); runExploit(e.id); }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{e.name}</Text>
                <Text style={{ color: '#ff6688', fontSize: 9 }}>{e.cve} | {e.type} | {e.target}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {pentestSubTab === 'trojans' && (
          <>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={() => analyzeTrojan()} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name="virus" size={20} color="#000" /><Text style={styles.scanButtonText}>ANALIZAR TROJAN</Text></>}
            </TouchableOpacity>
            {trojanAnalysis && (
              <View style={[styles.eyeResultCard, { borderColor: '#ff006660' }]}>
                <Text style={[styles.resultTitle, { color: '#ff0066' }]}>{trojanAnalysis.analysis.name}</Text>
                <Text style={{ color: '#ccc', fontSize: 10 }}>{trojanAnalysis.analysis.type} | {trojanAnalysis.analysis.language}</Text>
                <Text style={{ color: '#888', fontSize: 9 }}>{trojanAnalysis.analysis.description}</Text>
                <Text style={{ color: '#ff6644', fontSize: 9, marginTop: 4 }}>Evasion: {trojanAnalysis.evasion_techniques}</Text>
                <Text style={{ color: '#ffaa00', fontSize: 9 }}>Deteccion: {trojanAnalysis.detection_rate}</Text>
                <Text style={{ color: '#888', fontSize: 7, fontFamily: 'monospace', marginTop: 4 }}>MD5: {trojanAnalysis.indicators_of_compromise.md5}</Text>
              </View>
            )}
            {trojanTemplates && trojanTemplates.templates.map((t: any, i: number) => (
              <TouchableOpacity key={i} style={[styles.cellToolCard, { borderLeftColor: '#ff0066' }]} onPress={() => analyzeTrojan(t.name)}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{t.name}</Text>
                <Text style={{ color: '#ff6688', fontSize: 9 }}>{t.type} | {t.protocol} | {t.language}</Text>
                <Text style={{ color: '#ffaa00', fontSize: 8 }}>Deteccion: {t.detection_rate}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {pentestSubTab === 'sitemap' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff0066' }]}>
              <MaterialCommunityIcons name="sitemap" size={20} color="#ff0066" />
              <TextInput style={styles.input} placeholder="URL (ej: https://example.com)" placeholderTextColor="#666" value={sitemapUrl} onChangeText={setSitemapUrl} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={runSitemap} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>MAPEAR SITIO</Text>}
            </TouchableOpacity>
            {sitemapResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ff006660' }]}>
                <Text style={[styles.resultTitle, { color: '#ff0066' }]}>{sitemapResult.target}</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>{sitemapResult.total_paths_discovered} paths | {sitemapResult.accessible} OK | {sitemapResult.forbidden} 403</Text>
                {sitemapResult.results.slice(0, 12).map((r: any, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 1, borderLeftColor: r.status === 200 ? '#00cc66' : '#333' }]}>
                    <Text style={{ color: r.status === 200 ? '#ccc' : '#666', fontSize: 9, fontFamily: 'monospace' }}>{r.status} {r.path}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {pentestSubTab === 'recon' && (
          <>
            <View style={[styles.inputContainer, { borderColor: '#ff0066' }]}>
              <MaterialCommunityIcons name="account-search" size={20} color="#ff0066" />
              <TextInput style={styles.input} placeholder="Username..." placeholderTextColor="#666" value={reconUser} onChangeText={setReconUser} />
            </View>
            <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff0066' }, loading && styles.buttonDisabled]} onPress={runUserRecon} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>BUSCAR USUARIO</Text>}
            </TouchableOpacity>
            {reconResult && (
              <View style={[styles.eyeResultCard, { borderColor: '#ff006660' }]}>
                <Text style={[styles.resultTitle, { color: '#ff0066' }]}>@{reconResult.username}</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>Encontrado: {reconResult.found_on}/{reconResult.total_platforms}</Text>
                {reconResult.results.filter((r: any) => r.found).map((r: any, i: number) => (
                  <View key={i} style={[styles.resultItem, { borderLeftWidth: 2, borderLeftColor: '#00ff88' }]}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>{r.name} ({r.category})</Text>
                    <Text style={{ color: '#00ff88', fontSize: 8, fontFamily: 'monospace' }}>{r.url}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );


  // ========== CYBER TOOLS RENDER ==========
  const TOOL_CONFIG: Record<CyberToolsSubTab, { label: string; icon: string; placeholder: string; placeholder2?: string; button: string; color: string }> = {
    portscan: { label: 'PORT SCAN', icon: 'lan', placeholder: 'IP o dominio (ej: google.com)', placeholder2: 'Puertos (ej: 22,80,443)', button: 'ESCANEAR', color: '#ff0066' },
    dns: { label: 'DNS', icon: 'dns', placeholder: 'Dominio (ej: google.com)', button: 'RESOLVER', color: '#00ddff' },
    whois: { label: 'WHOIS', icon: 'earth', placeholder: 'Dominio (ej: google.com)', button: 'CONSULTAR', color: '#ffaa00' },
    hash: { label: 'HASH', icon: 'pound', placeholder: 'Texto a hashear', button: 'GENERAR', color: '#ff4400' },
    crack: { label: 'CRACK', icon: 'lock-open', placeholder: 'Hash a crackear (MD5/SHA1/SHA256)', button: 'CRACKEAR', color: '#ff0000' },
    encode: { label: 'ENCODE', icon: 'swap-horizontal', placeholder: 'Texto a codificar/decodificar', button: 'EJECUTAR', color: '#aa44ff' },
    jwt: { label: 'JWT', icon: 'code-json', placeholder: 'Token JWT completo', button: 'DECODIFICAR', color: '#ffcc00' },
    passgen: { label: 'PASS GEN', icon: 'key-plus', placeholder: 'Longitud (default: 20)', button: 'GENERAR', color: '#00ff88' },
    passcheck: { label: 'PASS CHK', icon: 'shield-check', placeholder: 'Contrasena a analizar', button: 'ANALIZAR', color: '#00cc66' },
    subnet: { label: 'SUBNET', icon: 'sitemap', placeholder: 'CIDR (ej: 192.168.1.0/24)', button: 'CALCULAR', color: '#00aaff' },
    headers: { label: 'HEADERS', icon: 'web', placeholder: 'URL (ej: google.com)', button: 'INSPECCIONAR', color: '#ff6600' },
    ping: { label: 'PING', icon: 'access-point', placeholder: 'Host (ej: google.com)', button: 'PING', color: '#44ff44' },
  };

  const renderCyberToolResult = () => {
    if (!ctResult) return null;
    if (ctResult.error) return <Text style={{ color: '#ff4444', fontSize: 12, padding: 10 }}>{ctResult.error}</Text>;

    const cfg = TOOL_CONFIG[ctSubTab];
    return (
      <View style={[styles.eyeResultCard, { borderColor: cfg.color + '60' }]}>
        <Text style={[styles.resultTitle, { color: cfg.color }]}>{ctResult.tool}</Text>

        {/* Port Scan */}
        {ctSubTab === 'portscan' && ctResult.results && (
          <>
            <Text style={{ color: '#ccc', fontSize: 10 }}>IP: {ctResult.ip} | OS: {ctResult.os_detection || 'N/A'}</Text>
            <Text style={{ color: cfg.color, fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>{ctResult.open} abiertos / {ctResult.total_scanned} escaneados</Text>
            {ctResult.results.filter((r: any) => r.state === 'open').map((r: any, i: number) => (
              <View key={i} style={[styles.resultItem, { borderLeftWidth: 2, borderLeftColor: '#00ff88' }]}>
                <Text style={{ color: '#00ff88', fontSize: 11 }}>{r.port}/{r.service} - OPEN</Text>
              </View>
            ))}
          </>
        )}

        {/* DNS */}
        {ctSubTab === 'dns' && ctResult.records && Object.entries(ctResult.records).map(([type, vals]) => (
          <View key={type} style={{ marginTop: 4 }}>
            <Text style={{ color: cfg.color, fontSize: 11, fontWeight: 'bold' }}>{type}:</Text>
            {(vals as string[]).map((v: string, i: number) => (
              <Text key={i} style={{ color: '#ccc', fontSize: 10, fontFamily: 'monospace', paddingLeft: 8 }}>{v}</Text>
            ))}
          </View>
        ))}

        {/* WHOIS */}
        {ctSubTab === 'whois' && ctResult.data && Object.entries(ctResult.data).filter(([_, v]) => v && (typeof v !== 'object' || (Array.isArray(v) && v.length > 0))).map(([k, v]) => (
          <View key={k} style={styles.cellRow}>
            <Text style={{ color: '#888', fontSize: 10 }}>{k}</Text>
            <Text style={{ color: '#ccc', fontSize: 10, flex: 1, textAlign: 'right' }} numberOfLines={1}>{Array.isArray(v) ? (v as string[]).join(', ') : String(v)}</Text>
          </View>
        ))}

        {/* Hash */}
        {ctSubTab === 'hash' && ctResult.hashes && Object.entries(ctResult.hashes).map(([algo, hash]) => (
          <View key={algo} style={{ marginTop: 4 }}>
            <Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold' }}>{algo.toUpperCase()}:</Text>
            <Text selectable style={{ color: '#ccc', fontSize: 8, fontFamily: 'monospace' }}>{hash as string}</Text>
          </View>
        ))}

        {/* Crack */}
        {ctSubTab === 'crack' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <MaterialCommunityIcons name={ctResult.cracked ? 'lock-open' : 'lock'} size={24} color={ctResult.cracked ? '#00ff88' : '#ff4444'} />
            <View>
              <Text style={{ color: ctResult.cracked ? '#00ff88' : '#ff4444', fontSize: 14, fontWeight: 'bold' }}>{ctResult.cracked ? `CRACKEADO: ${ctResult.password}` : 'NO ENCONTRADO'}</Text>
              <Text style={{ color: '#888', fontSize: 9 }}>{ctResult.attempts} intentos | Tipo: {ctResult.detected_type || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Encode */}
        {ctSubTab === 'encode' && (
          <>
            <Text style={{ color: '#888', fontSize: 9 }}>Operacion: {ctResult.operation}</Text>
            <Text selectable style={{ color: '#ccc', fontSize: 11, fontFamily: 'monospace', marginTop: 4, backgroundColor: '#111', padding: 8, borderRadius: 6 }}>{ctResult.output}</Text>
          </>
        )}

        {/* JWT */}
        {ctSubTab === 'jwt' && (
          <>
            <Text style={{ color: '#888', fontSize: 10 }}>Algoritmo: {ctResult.algorithm} | {ctResult.expired ? 'EXPIRADO' : 'VALIDO'}</Text>
            {ctResult.header && <><Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>Header:</Text><Text selectable style={{ color: '#ccc', fontSize: 9, fontFamily: 'monospace' }}>{JSON.stringify(ctResult.header, null, 2)}</Text></>}
            {ctResult.payload && <><Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>Payload:</Text><Text selectable style={{ color: '#ccc', fontSize: 9, fontFamily: 'monospace' }}>{JSON.stringify(ctResult.payload, null, 2)}</Text></>}
          </>
        )}

        {/* Password Gen */}
        {ctSubTab === 'passgen' && ctResult.passwords && ctResult.passwords.map((p: any, i: number) => (
          <View key={i} style={[styles.resultItem, { borderLeftWidth: 2, borderLeftColor: '#00ff88' }]}>
            <Text selectable style={{ color: '#00ff88', fontSize: 12, fontFamily: 'monospace' }}>{p.password}</Text>
            <Text style={{ color: '#888', fontSize: 8 }}>{p.strength} | {p.entropy_bits} bits</Text>
          </View>
        ))}

        {/* Password Check */}
        {ctSubTab === 'passcheck' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ color: ctResult.score >= 6 ? '#00ff88' : ctResult.score >= 4 ? '#ffaa00' : '#ff4444', fontSize: 20, fontWeight: 'bold' }}>{ctResult.score}/10</Text>
              <Text style={{ color: ctResult.score >= 6 ? '#00ff88' : ctResult.score >= 4 ? '#ffaa00' : '#ff4444', fontSize: 14, fontWeight: 'bold' }}>{ctResult.strength}</Text>
            </View>
            <Text style={{ color: '#888', fontSize: 10 }}>Entropia: {ctResult.entropy_bits} bits | Crackeo: {ctResult.crack_time_estimate}</Text>
            {ctResult.is_common && <Text style={{ color: '#ff0000', fontSize: 11, fontWeight: 'bold' }}>CONTRASENA COMUN!</Text>}
            {ctResult.feedback.map((f: string, i: number) => <Text key={i} style={{ color: '#ffaa00', fontSize: 9 }}>- {f}</Text>)}
          </>
        )}

        {/* Subnet */}
        {ctSubTab === 'subnet' && (
          <>
            {['network_address', 'broadcast_address', 'netmask', 'first_host', 'last_host', 'usable_hosts', 'prefix_length', 'is_private'].map(k => (
              <View key={k} style={styles.cellRow}>
                <Text style={{ color: '#888', fontSize: 10 }}>{k.replace(/_/g, ' ')}</Text>
                <Text style={{ color: '#ccc', fontSize: 11, fontFamily: 'monospace' }}>{String((ctResult as any)[k])}</Text>
              </View>
            ))}
          </>
        )}

        {/* HTTP Headers */}
        {ctSubTab === 'headers' && (
          <>
            <Text style={{ color: '#888', fontSize: 10 }}>Status: {ctResult.status_code} | Server: {ctResult.server}</Text>
            <Text style={{ color: cfg.color, fontSize: 11, fontWeight: 'bold', marginTop: 6 }}>Security Grade: {ctResult.security_grade}</Text>
            {ctResult.security_headers && Object.entries(ctResult.security_headers).map(([k, v]) => (
              <View key={k} style={styles.cellRow}>
                <Text style={{ color: '#888', fontSize: 8, flex: 1 }}>{k}</Text>
                <Text style={{ color: (v as string) === 'MISSING' ? '#ff4444' : '#00ff88', fontSize: 8 }} numberOfLines={1}>{(v as string).substring(0, 30)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Ping */}
        {ctSubTab === 'ping' && (
          <>
            <Text style={{ color: '#888', fontSize: 10 }}>IP: {ctResult.ip} | Loss: {ctResult.packet_loss}</Text>
            <Text style={{ color: cfg.color, fontSize: 12 }}>Min: {ctResult.min_ms}ms | Avg: {ctResult.avg_ms}ms | Max: {ctResult.max_ms}ms</Text>
            {ctResult.results.map((r: any, i: number) => (
              <Text key={i} style={{ color: r.status === 'ok' ? '#00ff88' : '#ff4444', fontSize: 9, fontFamily: 'monospace' }}>seq={r.seq} time={r.time_ms}ms {r.status}</Text>
            ))}
          </>
        )}
      </View>
    );
  };

  const renderCyberTools = () => {
    const cfg = TOOL_CONFIG[ctSubTab];
    return (
      <View style={styles.tabContent}>
        <View style={styles.eyeHeader}>
          <TouchableOpacity onPress={() => setActiveTab('home')}>
            <Ionicons name="arrow-back" size={28} color="#aa00ff" />
          </TouchableOpacity>
          <View style={styles.eyeTitleContainer}>
            <MaterialCommunityIcons name="tools" size={24} color="#aa00ff" />
            <Text style={[styles.eyeTitle, { color: '#aa00ff' }]}>CYBER TOOLS</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, maxHeight: 36 }}>
          {(Object.keys(TOOL_CONFIG) as CyberToolsSubTab[]).map(key => (
            <TouchableOpacity key={key} style={[styles.cellSubTab, ctSubTab === key && { backgroundColor: TOOL_CONFIG[key].color }]} onPress={() => { setCtSubTab(key); setCtResult(null); setCtInput(''); setCtInput2(''); }}>
              <Text style={[styles.cellSubTabText, { color: ctSubTab === key ? '#000' : TOOL_CONFIG[key].color, fontSize: 8 }]}>{TOOL_CONFIG[key].label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.inputContainer, { borderColor: cfg.color }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
            <TextInput style={styles.input} placeholder={cfg.placeholder} placeholderTextColor="#666" value={ctInput} onChangeText={setCtInput} secureTextEntry={ctSubTab === 'passcheck'} />
          </View>
          {cfg.placeholder2 && (
            <View style={[styles.inputContainer, { borderColor: cfg.color + '80', marginTop: 6 }]}>
              <TextInput style={styles.input} placeholder={cfg.placeholder2} placeholderTextColor="#666" value={ctInput2} onChangeText={setCtInput2} />
            </View>
          )}
          {ctSubTab === 'encode' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6, maxHeight: 28 }}>
              {['base64_encode', 'base64_decode', 'hex_encode', 'hex_decode', 'url_encode', 'url_decode', 'rot13', 'binary', 'morse_encode', 'ascii', 'reverse'].map(op => (
                <TouchableOpacity key={op} onPress={() => setCtEncodeOp(op)} style={[styles.cellTag, { borderColor: ctEncodeOp === op ? cfg.color : '#333', marginRight: 3 }]}>
                  <Text style={{ color: ctEncodeOp === op ? cfg.color : '#666', fontSize: 7 }}>{op.replace('_', ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={[styles.scanButton, { backgroundColor: cfg.color }, loading && styles.buttonDisabled]} onPress={runCyberTool} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <><MaterialCommunityIcons name={cfg.icon as any} size={18} color="#000" /><Text style={styles.scanButtonText}>{cfg.button}</Text></>}
          </TouchableOpacity>
          {renderCyberToolResult()}
        </ScrollView>
      </View>
    );
  };

  const renderSimpleTab = (title: string, color: string, icon: string, content: React.ReactNode) => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('home')}><Ionicons name="arrow-back" size={28} color={color} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color }]}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>
      {content}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {activeTab === 'home' && renderHome()}
      {activeTab === 'eye' && renderEye()}
      {activeTab === 'cellular' && renderCellular()}
      {activeTab === 'secrets' && renderSecrets()}
      {activeTab === 'dorks' && renderDorks()}
      {activeTab === 'mexosint' && renderMexOsint()}
      {activeTab === 'realapis' && renderRealApis()}
      {activeTab === 'pentest' && renderPentest()}
      {activeTab === 'cybertools' && renderCyberTools()}
      {activeTab === 'c2' && renderC2()}
      {activeTab === 'ctf' && renderCtf()}
      {activeTab === 'osint' && renderSimpleTab('OSINT Scanner', '#00ff88', 'account-search', (
        <>
          <View style={styles.inputContainer}><MaterialCommunityIcons name="account-search" size={24} color="#00ff88" /><TextInput style={styles.input} placeholder="Username..." placeholderTextColor="#666" value={osintUsername} onChangeText={setOsintUsername} /></View>
          <TouchableOpacity style={[styles.scanButton, loading && styles.buttonDisabled]} onPress={scanOSINT} disabled={loading}>{loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>SCAN</Text>}</TouchableOpacity>
          <ScrollView>{osintResults.map((r, i) => <View key={i} style={styles.resultCard}><Text style={styles.platformName}>{r.platform}</Text><View style={[styles.statusBadge, { backgroundColor: r.exists ? '#00ff88' : '#ff4444' }]}><Text style={styles.statusText}>{r.exists ? 'FOUND' : 'NOT FOUND'}</Text></View></View>)}</ScrollView>
        </>
      ))}
      {activeTab === 'password' && renderSimpleTab('Password Check', '#ff00ff', 'shield-lock', (
        <>
          <View style={[styles.inputContainer, { borderColor: '#ff00ff' }]}><MaterialCommunityIcons name="lock" size={24} color="#ff00ff" /><TextInput style={styles.input} placeholder="Password..." placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry /></View>
          <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#ff00ff' }, loading && styles.buttonDisabled]} onPress={checkPassword} disabled={loading}>{loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>CHECK</Text>}</TouchableOpacity>
          {passwordResult && <View style={[styles.resultCard, { borderColor: '#ff00ff' }]}><Text style={[styles.strengthText, { color: passwordResult.strength === 'Strong' ? '#00ff88' : '#ff4444' }]}>{passwordResult.strength}</Text><Text style={styles.breachText}>{passwordResult.is_pwned ? `Found in ${passwordResult.breach_count} breaches!` : 'Not found in breaches'}</Text></View>}
        </>
      ))}
      {activeTab === 'website' && renderSimpleTab('Website Analyzer', '#00ffff', 'web', (
        <>
          <View style={[styles.inputContainer, { borderColor: '#00ffff' }]}><MaterialCommunityIcons name="web" size={24} color="#00ffff" /><TextInput style={styles.input} placeholder="URL..." placeholderTextColor="#666" value={websiteUrl} onChangeText={setWebsiteUrl} /></View>
          <TouchableOpacity style={[styles.scanButton, { backgroundColor: '#00ffff' }, loading && styles.buttonDisabled]} onPress={analyzeWebsite} disabled={loading}>{loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>ANALYZE</Text>}</TouchableOpacity>
          {websiteResult && <View style={[styles.resultCard, { borderColor: '#00ffff' }]}><Text style={styles.scoreText}>{websiteResult.overall_score}</Text>{websiteResult.headers.map((h: any, i: number) => <View key={i} style={styles.headerRow}><MaterialCommunityIcons name={h.present ? 'check-circle' : 'close-circle'} size={16} color={h.present ? '#00ff88' : '#ff4444'} /><Text style={styles.headerName}>{h.header}</Text></View>)}</View>}
        </>
      ))}
      {activeTab === 'chat' && renderSimpleTab('AI Chat', '#ffff00', 'robot', (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>{chatHistory.map((msg, i) => <View key={i} style={[styles.chatBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={styles.chatText}>{msg.content}</Text></View>)}</ScrollView>
          <View style={styles.chatInputContainer}><TextInput style={styles.chatInput} placeholder="Ask..." placeholderTextColor="#666" value={chatMessage} onChangeText={setChatMessage} /><TouchableOpacity style={styles.sendButton} onPress={sendChat}><Ionicons name="send" size={20} color="#000" /></TouchableOpacity></View>
        </KeyboardAvoidingView>
      ))}
      {activeTab === 'intel' && renderSimpleTab('Security Intel', '#ff6600', 'shield-bug', <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>CVE, Tech Detection, DDoS Analysis</Text>)}
      {activeTab === 'defense' && renderSimpleTab('Defense Center', '#00ff00', 'shield-check', <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>IP Rep, Firewall, Threats</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  homeScroll: { flex: 1, paddingTop: 45, paddingHorizontal: 16 },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 48, fontWeight: 'bold', color: '#00ff88' },
  subtitleText: { fontSize: 18, color: '#ff00ff', fontStyle: 'italic' },
  taglineText: { fontSize: 11, color: '#666', marginTop: 2 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  featureCardWide: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, gap: 12 },
  wideCardText: { flex: 1 },
  featureTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  featureDesc: { color: '#666', fontSize: 10, marginTop: 2 },
  eyeCard: { backgroundColor: '#1a0a0a', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: '#ff0000' },
  eyeCardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eyeIconSmall: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2a0a0a', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  eyeCardText: { flex: 1 },
  eyeCardTitle: { color: '#ff0000', fontSize: 18, fontWeight: 'bold' },
  eyeCardSubtitle: { color: '#ff6666', fontSize: 11, marginTop: 2 },
  eyeCardStats: { flexDirection: 'row', justifyContent: 'space-around' },
  eyeCardStat: { color: '#ff4444', fontSize: 11, fontWeight: 'bold' },
  footerInline: { alignItems: 'center', paddingVertical: 16 },
  footerText: { color: '#444', fontSize: 10 },
  tabContent: { flex: 1, paddingTop: 45, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { color: '#00ff88', fontSize: 18, fontWeight: 'bold' },
  eyeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eyeTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeTitle: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1a0a0a', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ff000040' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#ff6666', fontSize: 9 },
  eyeSubTabs: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#1a0a0a', borderRadius: 8, padding: 3 },
  eyeSubTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 4 },
  eyeSubTabActive: { backgroundColor: '#ff0000' },
  eyeSubTabText: { color: '#ff0000', fontSize: 10, fontWeight: 'bold' },
  eyeSubTabTextActive: { color: '#000' },
  searchTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  searchTypeBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1a1a1a', borderRadius: 6 },
  searchTypeBtnActive: { backgroundColor: '#ff0000' },
  searchTypeText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  searchTypeTextActive: { color: '#000' },
  eyeInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a0a0a', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ff0000', marginBottom: 10 },
  eyeInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 12, marginLeft: 8 },
  eyeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff0000', paddingVertical: 14, borderRadius: 10, marginBottom: 14, gap: 8 },
  eyeButtonText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  eyeResultCard: { backgroundColor: '#1a0a0a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ff000060', marginBottom: 10 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitle: { color: '#ff0000', fontSize: 16, fontWeight: 'bold' },
  resultSources: { color: '#ff6666', fontSize: 11 },
  resultItem: { backgroundColor: '#0d0505', borderRadius: 8, padding: 10, marginBottom: 8 },
  resultItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  resultSource: { color: '#ff4444', fontSize: 12, fontWeight: 'bold' },
  confidenceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  confidenceText: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  resultType: { color: '#888', fontSize: 10, marginBottom: 4 },
  resultData: { backgroundColor: '#0a0a0a', borderRadius: 4, padding: 6 },
  resultDataItem: { color: '#ccc', fontSize: 10, marginBottom: 2 },
  sectionTitle: { color: '#ff0000', fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  sectionSubtitle: { color: '#ff6666', fontSize: 10, marginBottom: 8 },
  mapContainer: { backgroundColor: '#0a0a0a', borderRadius: 10, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ff000030' },
  regionList: { gap: 8 },
  regionCard: { backgroundColor: '#0d0505', borderRadius: 8, padding: 10 },
  regionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  regionName: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  regionCount: { color: '#ff0000', fontSize: 12, fontWeight: 'bold' },
  regionTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  typeTag: { backgroundColor: '#ff000020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { color: '#ff6666', fontSize: 9 },
  totalCameras: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, backgroundColor: '#1a0a0a', borderRadius: 8 },
  totalText: { color: '#ff0000', fontSize: 14, fontWeight: 'bold' },
  breachHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  breachInfo: { flex: 1 },
  breachStatus: { fontSize: 18, fontWeight: 'bold' },
  breachEmail: { color: '#888', fontSize: 12 },
  breachCount: { color: '#ff6666', fontSize: 14, marginBottom: 12 },
  exposedData: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  exposedTag: { backgroundColor: '#ff000030', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  exposedText: { color: '#ff4444', fontSize: 11, fontWeight: 'bold' },
  breachCard: { backgroundColor: '#0d0505', borderRadius: 8, padding: 10, marginBottom: 6 },
  breachName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  breachDate: { color: '#888', fontSize: 11 },
  breachRecords: { color: '#ff4444', fontSize: 11 },
  domainTitle: { color: '#ff0000', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { color: '#fff', fontSize: 13 },
  geoInfo: { backgroundColor: '#0d0505', borderRadius: 8, padding: 10 },
  geoItem: { color: '#ccc', fontSize: 12, marginBottom: 2 },
  techTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  techTag: { backgroundColor: '#ff000020', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  techText: { color: '#ff6666', fontSize: 11, fontWeight: 'bold' },
  subdomain: { color: '#888', fontSize: 12, marginBottom: 4 },
  cellCard: { backgroundColor: '#0a0a1a', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: '#00ccff' },
  cellSubTab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4, marginRight: 4, backgroundColor: '#0a0a1a' },
  cellSubTabActive: { backgroundColor: '#00ccff' },
  cellSubTabText: { color: '#00ccff', fontSize: 9, fontWeight: 'bold' },
  cellRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#111' },
  cellBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  cellTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  cellInfoBox: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#0a0a1a', borderRadius: 8, borderWidth: 1, borderColor: '#00ccff20', marginTop: 8 },
  cellToolCard: { backgroundColor: '#0a0a1a', borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  cellHwCard: { backgroundColor: '#0a0a1a', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#00ccff20' },
  cellHwRow: { flexDirection: 'row', marginBottom: 2 },
  cellHwLabel: { color: '#00ccff', fontSize: 10, width: 40, fontWeight: 'bold' },
  cellHwValue: { color: '#ccc', fontSize: 10, flex: 1 },
  cellAtkCard: { backgroundColor: '#0a0a0f', borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  cellScanHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#0a0a0a', borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  cellScanItem: { backgroundColor: '#0a0a1a', borderRadius: 6, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#111' },
  cellMxOpCard: { backgroundColor: '#0a0a1a', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#00ccff20' },
  cellMxStateCard: { backgroundColor: '#0a0a1a', borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#111' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#00ff88', marginBottom: 10 },
  input: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 12, marginLeft: 8 },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00ff88', paddingVertical: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  buttonDisabled: { opacity: 0.6 },
  scanButtonText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  resultsContainer: { flex: 1 },
  resultCard: { backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#00ff88', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platformName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  strengthText: { fontSize: 24, fontWeight: 'bold' },
  breachText: { color: '#888', fontSize: 12 },
  scoreText: { color: '#00ffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerName: { color: '#ccc', fontSize: 11 },
  chatBubble: { maxWidth: '85%', padding: 10, borderRadius: 12, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1a3a2a', borderColor: '#00ff88', borderWidth: 1 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#1a1a2a', borderColor: '#ffff00', borderWidth: 1 },
  chatText: { color: '#fff', fontSize: 13 },
  chatInputContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#222' },
  chatInput: { flex: 1, backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#ffff00' },
  sendButton: { backgroundColor: '#ffff00', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  eyeContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  eyeOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ff000020', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ff0000' },
  eyeInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ff0000', alignItems: 'center', justifyContent: 'center' },
  eyePupil: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  eyeHighlight: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', position: 'absolute', top: 5, left: 5 },
});
