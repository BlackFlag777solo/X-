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
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type TabType = 'home' | 'osint' | 'password' | 'website' | 'chat' | 'intel' | 'defense' | 'eye' | 'cellular' | 'secrets' | 'dorks' | 'mexosint' | 'realapis';
type EyeSubTab = 'search' | 'map' | 'breach' | 'domain';
type CellularSubTab = 'dashboard' | 'tools' | 'hardware' | 'attacks' | 'scan' | 'mexico';
type SecretsSubTab = 'scanner' | 'patterns' | 'keyhacks';
type DorksSubTab = 'database' | 'operators' | 'builder';
type MexSubTab = 'dashboard' | 'states' | 'cities' | 'zipcode' | 'curp' | 'telecom';
type RealSubTab = 'shodan' | 'breach' | 'ssl' | 'weather' | 'safebrowsing';

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
      const response = await axios.post(`${API_URL}/api/real/shodan-lookup`, { ip: shodanIp });
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
      const response = await axios.post(`${API_URL}/api/real/weather`, { city: weatherCity });
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

  const renderHome = () => (
    <ScrollView style={styles.homeScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>X=pi</Text>
        <Text style={styles.subtitleText}>by Carbi</Text>
        <Text style={styles.taglineText}>Cybersecurity Toolkit v4.0</Text>
      </View>

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

      <View style={styles.footerInline}>
        <Text style={styles.footerText}>X=pi by Carbi - v4.0</Text>
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
