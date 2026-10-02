import React, { useState, useRef, useMemo } from 'react';
import { 
  Download, Upload, Search, X, Plus, Palette, 
  HelpCircle, Image as ImageIcon, FileText,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { toSvg, toPng } from 'html-to-image';

// --- UTILITIES: Color Math & Luminance ---
const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#d1d5db';
  const [r, g, b] = hexToRgb(hexColor);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 135 ? '#111827' : '#ffffff';
};

const interpolateColor = (score, min, max, lowHex, highHex) => {
  if (score === '' || score === null || score === undefined) return null;
  const num = Number(score);
  if (isNaN(num)) return null;
  let t = (num - min) / (max - min);
  t = Math.max(0, Math.min(1, t)); 
  const [r1, g1, b1] = hexToRgb(lowHex);
  const [r2, g2, b2] = hexToRgb(highHex);
  return rgbToHex(r1 + t * (r2 - r1), g1 + t * (g2 - g1), b1 + t * (b2 - b1));
};

const PREDEFINED_COLORS = [
  '#ea4335', '#fbbc04', '#34a853', '#4285f4', '#9c27b0',
  '#e06666', '#f6b26b', '#93c47d', '#6d9eeb', '#c27ba0',
  '#cc0000', '#e69138', '#38761d', '#1155cc', '#741b47',
  '#ffffff', '#cccccc', '#999999', '#666666', '#000000'
];

// --- OFFICIAL D3FEND ONTOLOGY HIERARCHY ---
const D3FEND_DATA = [
  {
    tactic: "Model",
    categories: [
      {
        id: "D3-AI",
        name: "Asset Inventory",
        techniques: [
          { id: "D3-AVE", name: "Asset Vulnerability Enumeration" },
          { id: "D3-CIA", name: "Container Image Analysis" },
          { id: "D3-CI", name: "Configuration Inventory" },
          { id: "D3-DI", name: "Data Inventory" },
          { id: "D3-HCI", name: "Hardware Component Inventory" },
          { id: "D3-NNI", name: "Network Node Inventory" },
          { id: "D3-SWI", name: "Software Inventory" }
        ]
      },
      {
        id: "D3-NM",
        name: "Network Mapping",
        techniques: [
          { id: "D3-LLM", name: "Logical Link Mapping" },
          { id: "D3-ALLM", name: "Active Logical Link Mapping" },
          { id: "D3-PLLM", name: "Passive Logical Link Mapping" },
          { id: "D3-NTPM", name: "Network Traffic Policy Mapping" },
          { id: "D3-NVA", name: "Network Vulnerability Assessment" },
          { id: "D3-PLM", name: "Physical Link Mapping" },
          { id: "D3-APLM", name: "Active Physical Link Mapping" },
          { id: "D3-DPLM", name: "Direct Physical Link Mapping" }
        ]
      },
      {
        id: "D3-OAM",
        name: "Operational Activity Mapping",
        techniques: [
          { id: "D3-AM", name: "Access Modeling" },
          { id: "D3-ODM", name: "Operational Dependency Mapping" },
          { id: "D3-ORA", name: "Operational Risk Assessment" },
          { id: "D3-OM", name: "Organization Mapping" }
        ]
      },
      {
        id: "D3-SYSM",
        name: "System Mapping",
        techniques: [
          { id: "D3-DEM", name: "Data Exchange Mapping" },
          { id: "D3-SVCDM", name: "Service Dependency Mapping" },
          { id: "D3-SYSDM", name: "System Dependency Mapping" },
          { id: "D3-SYSVA", name: "System Vulnerability Assessment" }
        ]
      }
    ]
  },
  {
    tactic: "Harden",
    categories: [
      {
        id: "D3-AA",
        name: "Agent Authentication",
        techniques: [
          { id: "D3-BAN", name: "Biometric Authentication" },
          { id: "D3-CBAN", name: "Certificate-based Authentication" },
          { id: "D3-MFA", name: "Multi-factor Authentication" },
          { id: "D3-PWA", name: "Password Authentication" },
          { id: "D3-TBA", name: "Token-based Authentication" }
        ]
      },
      {
        id: "D3-AH",
        name: "Application Hardening",
        techniques: [
          { id: "D3-ACH", name: "Application Configuration Hardening" },
          { id: "D3-CFI", name: "Control Flow Integrity" },
          { id: "D3-DCE", name: "Dead Code Elimination" },
          { id: "D3-EHPV", name: "Exception Handler Pointer Validation" },
          { id: "D3-PAN", name: "Pointer Authentication" },
          { id: "D3-PSEP", name: "Process Segment Execution Prevention" },
          { id: "D3-SAOR", name: "Segment Address Offset Randomization" },
          { id: "D3-SFCV", name: "Stack Frame Canary Validation" }
        ]
      },
      {
        id: "D3-CH",
        name: "Credential Hardening",
        techniques: [
          { id: "D3-CP", name: "Certificate Pinning" },
          { id: "D3-CRO", name: "Credential Rotation" },
          { id: "D3-CERO", name: "Certificate Rotation" },
          { id: "D3-PR", name: "Password Rotation" },
          { id: "D3-OTP", name: "One-time Password" },
          { id: "D3-SPP", name: "Strong Password Policy" },
          { id: "D3-CDP", name: "Change Default Password" },
          { id: "D3-TB", name: "Token Binding" }
        ]
      },
      {
        id: "D3-MH",
        name: "Message Hardening",
        techniques: [
          { id: "D3-MAN", name: "Message Authentication" },
          { id: "D3-BMA", name: "Bus Message Authentication" },
          { id: "D3-MENCR", name: "Message Encryption" },
          { id: "D3-TAAN", name: "Transfer Agent Authentication" }
        ]
      },
      {
        id: "D3-PH",
        name: "Platform Hardening",
        techniques: [
          { id: "D3-BA", name: "Bootloader Authentication" },
          { id: "D3-DENCR", name: "Disk Encryption" },
          { id: "D3-DLIC", name: "Driver Load Integrity Checking" },
          { id: "D3-FE", name: "File Encryption" },
          { id: "D3-HBWP", name: "Hardware-based Write Protection" },
          { id: "D3-PEH", name: "Physical Enclosure Hardening" },
          { id: "D3-RH", name: "Radiation Hardening" },
          { id: "D3-EMH", name: "Electromagnetic Radiation Hardening" },
          { id: "D3-RFS", name: "RF Shielding" },
          { id: "D3-SU", name: "Software Update" },
          { id: "D3-SCP", name: "System Configuration Permissions" },
          { id: "D3-TBI", name: "TPM Boot Integrity" }
        ]
      },
      {
        id: "D3-SCH",
        name: "Source Code Hardening",
        techniques: [
          { id: "D3-CS", name: "Credential Scrubbing" },
          { id: "D3-DLV", name: "Domain Logic Validation" },
          { id: "D3-OLV", name: "Operational Logic Validation" },
          { id: "D3-IRV", name: "Integer Range Validation" },
          { id: "D3-PV", name: "Pointer Validation" },
          { id: "D3-MBSV", name: "Memory Block Start Validation" },
          { id: "D3-NPC", name: "Null Pointer Checking" },
          { id: "D3-RN", name: "Reference Nullification" },
          { id: "D3-TL", name: "Trusted Library" },
          { id: "D3-VI", name: "Variable Initialization" },
          { id: "D3-VTV", name: "Variable Type Validation" }
        ]
      }
    ]
  },
  {
    tactic: "Detect",
    categories: [
      {
        id: "D3-FA",
        name: "File Analysis",
        techniques: [
          { id: "D3-DA", name: "Dynamic Analysis" },
          { id: "D3-EFA", name: "Emulated File Analysis" },
          { id: "D3-FCOA", name: "File Content Analysis" },
          { id: "D3-FCR", name: "File Content Rules" },
          { id: "D3-FH", name: "File Hashing" }
        ]
      },
      {
        id: "D3-ID",
        name: "Identifier Analysis",
        techniques: [
          { id: "D3-HD", name: "Homoglyph Detection" },
          { id: "D3-IAA", name: "Identifier Activity Analysis" },
          { id: "D3-IRA", name: "Identifier Reputation Analysis" },
          { id: "D3-DNRA", name: "Domain Name Reputation Analysis" },
          { id: "D3-FHRA", name: "File Hash Reputation Analysis" },
          { id: "D3-IPRA", name: "IP Reputation Analysis" },
          { id: "D3-URA", name: "URL Reputation Analysis" },
          { id: "D3-UA", name: "URL Analysis" }
        ]
      },
      {
        id: "D3-MA",
        name: "Message Analysis",
        techniques: [
          { id: "D3-SMRA", name: "Sender MTA Reputation Analysis" },
          { id: "D3-SRA", name: "Sender Reputation Analysis" }
        ]
      },
      {
        id: "D3-NTA",
        name: "Network Traffic Analysis",
        techniques: [
          { id: "D3-ANAA", name: "Administrative Network Activity Analysis" },
          { id: "D3-APCA", name: "Application Protocol Command Analysis" },
          { id: "D3-RFUM", name: "Remote Firmware Update Monitoring" },
          { id: "D3-BSE", name: "Byte Sequence Emulation" },
          { id: "D3-CA", name: "Certificate Analysis" },
          { id: "D3-ACA", name: "Active Certificate Analysis" },
          { id: "D3-PCA", name: "Passive Certificate Analysis" },
          { id: "D3-CSPP", name: "Client-server Payload Profiling" },
          { id: "D3-CAA", name: "Connection Attempt Analysis" },
          { id: "D3-DNSTA", name: "DNS Traffic Analysis" },
          { id: "D3-FC", name: "File Carving" },
          { id: "D3-ISVA", name: "Inbound Session Volume Analysis" },
          { id: "D3-IPCTA", name: "IPC Traffic Analysis" },
          { id: "D3-NTCD", name: "Network Traffic Community Deviation" },
          { id: "D3-NTSA", name: "Network Traffic Signature Analysis" },
          { id: "D3-PHDURA", name: "Per Host Download-Upload Ratio Analysis" },
          { id: "D3-PMAD", name: "Protocol Metadata Anomaly Detection" },
          { id: "D3-RPA", name: "Relay Pattern Analysis" },
          { id: "D3-RTSD", name: "Remote Terminal Session Detection" },
          { id: "D3-RTA", name: "RPC Traffic Analysis" }
        ]
      },
      {
        id: "D3-PHAM",
        name: "Physical Access Monitoring",
        techniques: [
          { id: "D3-ELM", name: "Electronic Lock Monitoring" },
          { id: "D3-MSM", name: "Motion Sensor Monitoring" },
          { id: "D3-PSM", name: "Proximity Sensor Monitoring" },
          { id: "D3-VS", name: "Video Surveillance" }
        ]
      },
      {
        id: "D3-PM",
        name: "Platform Monitoring",
        techniques: [
          { id: "D3-APM", name: "Application Performance Monitoring" },
          { id: "D3-AEM", name: "Application Exception Monitoring" },
          { id: "D3-FIM", name: "File Integrity Monitoring" },
          { id: "D3-FBA", name: "Firmware Behavior Analysis" },
          { id: "D3-FEMC", name: "Firmware Embedded Monitoring Code" },
          { id: "D3-FV", name: "Firmware Verification" },
          { id: "D3-PFV", name: "Peripheral Firmware Verification" },
          { id: "D3-SFV", name: "System Firmware Verification" },
          { id: "D3-OMM", name: "Operating Mode Monitoring" },
          { id: "D3-OSM", name: "Operating System Monitoring" },
          { id: "D3-EHB", name: "Endpoint Health Beacon" },
          { id: "D3-IDA", name: "Input Device Analysis" },
          { id: "D3-MBT", name: "Memory Boundary Tracking" },
          { id: "D3-SJA", name: "Scheduled Job Analysis" },
          { id: "D3-SDM", name: "System Daemon Monitoring" },
          { id: "D3-SFA", name: "System File Analysis" },
          { id: "D3-SBV", name: "Service Binary Verification" },
          { id: "D3-SICA", name: "System Init Config Analysis" },
          { id: "D3-USICA", name: "User Session Init Config Analysis" },
          { id: "D3-OPM", name: "Operational Process Monitoring" },
          { id: "D3-PUM", name: "Platform Uptime Monitoring" }
        ]
      },
      {
        id: "D3-PA",
        name: "Process Analysis",
        techniques: [
          { id: "D3-DQSA", name: "Database Query String Analysis" },
          { id: "D3-FAPA", name: "File Access Pattern Analysis" },
          { id: "D3-IBCA", name: "Indirect Branch Call Analysis" },
          { id: "D3-PCSV", name: "Process Code Segment Verification" },
          { id: "D3-PSMD", name: "Process Self-Modification Detection" },
          { id: "D3-PSA", name: "Process Spawn Analysis" },
          { id: "D3-PLA", name: "Process Lineage Analysis" },
          { id: "D3-SEA", name: "Script Execution Analysis" },
          { id: "D3-SSC", name: "Shadow Stack Comparisons" },
          { id: "D3-SCA", name: "System Call Analysis" },
          { id: "D3-FCA", name: "File Creation Analysis" }
        ]
      },
      {
        id: "D3-UBA",
        name: "User Behavior Analysis",
        techniques: [
          { id: "D3-ANET", name: "Authentication Event Thresholding" },
          { id: "D3-AZET", name: "Authorization Event Thresholding" },
          { id: "D3-CCSA", name: "Credential Compromise Scope Analysis" },
          { id: "D3-DAM", name: "Domain Account Monitoring" },
          { id: "D3-JFAPA", name: "Job Function Access Pattern Analysis" },
          { id: "D3-LAM", name: "Local Account Monitoring" },
          { id: "D3-RAPA", name: "Resource Access Pattern Analysis" },
          { id: "D3-SDA", name: "Session Duration Analysis" },
          { id: "D3-UDTA", name: "User Data Transfer Analysis" },
          { id: "D3-UGLPA", name: "User Geolocation Logon Pattern Analysis" },
          { id: "D3-WSAA", name: "Web Session Activity Analysis" }
        ]
      }
    ]
  },
  {
    tactic: "Isolate",
    categories: [
      {
        id: "D3-AMED",
        name: "Access Mediation",
        techniques: [
          { id: "D3-CTS", name: "Credential Transmission Scoping" },
          { id: "D3-IOPR", name: "IO Port Restriction" },
          { id: "D3-NAM", name: "Network Access Mediation" },
          { id: "D3-LAMED", name: "LAN Access Mediation" },
          { id: "D3-RAM", name: "Routing Access Mediation" },
          { id: "D3-NRAM", name: "Network Resource Access Mediation" },
          { id: "D3-RFAM", name: "Remote File Access Mediation" },
          { id: "D3-WSAM", name: "Web Session Access Mediation" },
          { id: "D3-EBWSAM", name: "Endpoint-based Web Server Access Mediation" },
          { id: "D3-PBWSAM", name: "Proxy-based Web Server Access Mediation" },
          { id: "D3-OPR", name: "Operating Mode Restriction" },
          { id: "D3-OVAR", name: "OT Variable Access Restriction" },
          { id: "D3-PAM", name: "Physical Access Mediation" },
          { id: "D3-EPL", name: "Physical Locking" },
          { id: "D3-SCF", name: "System Call Filtering" },
          { id: "D3-LFAM", name: "Local File Access Mediation" }
        ]
      },
      {
        id: "D3-APA",
        name: "Access Policy Administration",
        techniques: [
          { id: "D3-DTP", name: "Domain Trust Policy" },
          { id: "D3-LFP", name: "Local File Permissions" },
          { id: "D3-UAP", name: "User Account Permissions" },
          { id: "D3-UGPH", name: "User Group Permissions" }
        ]
      },
      {
        id: "D3-CF",
        name: "Content Filtering",
        techniques: [
          { id: "D3-CM", name: "Content Modification" },
          { id: "D3-CNE", name: "Content Excision" },
          { id: "D3-CFC", name: "Content Format Conversion" },
          { id: "D3-CNR", name: "Content Rebuild" },
          { id: "D3-CNS", name: "Content Substitution" },
          { id: "D3-CQ", name: "Content Quarantine" },
          { id: "D3-CV", name: "Content Validation" },
          { id: "D3-FFV", name: "File Format Verification" },
          { id: "D3-FCDC", name: "File Content Decompression Checking" },
          { id: "D3-FISV", name: "File Internal Structure Verification" },
          { id: "D3-FMCV", name: "File Metadata Consistency Validation" },
          { id: "D3-FMVV", name: "File Metadata Value Verification" },
          { id: "D3-FMBV", name: "File Magic Byte Verification" }
        ]
      },
      {
        id: "D3-EI",
        name: "Execution Isolation",
        techniques: [
          { id: "D3-ABPI", name: "Application-based Process Isolation" },
          { id: "D3-EAL", name: "Executable Allowlisting" },
          { id: "D3-EDL", name: "Executable Denylisting" },
          { id: "D3-HBPI", name: "Hardware-based Process Isolation" },
          { id: "D3-KBPI", name: "Kernel-based Process Isolation" }
        ]
      },
      {
        id: "D3-NI",
        name: "Network Isolation",
        techniques: [
          { id: "D3-BDI", name: "Broadcast Domain Isolation" },
          { id: "D3-DNL", name: "Directional Network Link" },
          { id: "D3-DNSAL", name: "DNS Allowlisting" },
          { id: "D3-DNSDL", name: "DNS Denylisting" },
          { id: "D3-FRDDL", name: "Forward Resolution Domain Denylisting" },
          { id: "D3-HDDL", name: "Hierarchical Domain Denylisting" },
          { id: "D3-HDL", name: "Homoglyph Denylisting" },
          { id: "D3-FRIDL", name: "Forward Resolution IP Denylisting" },
          { id: "D3-RRID", name: "Reverse Resolution IP Denylisting" },
          { id: "D3-ET", name: "Encrypted Tunnels" },
          { id: "D3-NTF", name: "Network Traffic Filtering" },
          { id: "D3-ITF", name: "Inbound Traffic Filtering" },
          { id: "D3-EF", name: "Email Filtering" },
          { id: "D3-OTF", name: "Outbound Traffic Filtering" }
        ]
      }
    ]
  },
  {
    tactic: "Deceive",
    categories: [
      {
        id: "D3-DE",
        name: "Decoy Environment",
        techniques: [
          { id: "D3-CHN", name: "Connected Honeynet" },
          { id: "D3-IHN", name: "Integrated Honeynet" },
          { id: "D3-SHN", name: "Standalone Honeynet" }
        ]
      },
      {
        id: "D3-DO",
        name: "Decoy Object",
        techniques: [
          { id: "D3-DF", name: "Decoy File" },
          { id: "D3-DNR", name: "Decoy Network Resource" },
          { id: "D3-DP", name: "Decoy Persona" },
          { id: "D3-DPR", name: "Decoy Public Release" },
          { id: "D3-DST", name: "Decoy Session Token" },
          { id: "D3-DUC", name: "Decoy User Credential" }
        ]
      }
    ]
  },
  {
    tactic: "Evict",
    categories: [
      {
        id: "D3-CE",
        name: "Credential Eviction",
        techniques: [
          { id: "D3-AL", name: "Account Locking" },
          { id: "D3-ANCI", name: "Authentication Cache Invalidation" },
          { id: "D3-CR", name: "Credential Revocation" }
        ]
      },
      {
        id: "D3-OE",
        name: "Object Eviction",
        techniques: [
          { id: "D3-DKF", name: "Disk Formatting" },
          { id: "D3-DKE", name: "Disk Erasure" },
          { id: "D3-DKP", name: "Disk Partitioning" },
          { id: "D3-DNSCE", name: "DNS Cache Eviction" },
          { id: "D3-DRT", name: "Domain Registration Takedown" },
          { id: "D3-FEV", name: "File Eviction" },
          { id: "D3-ER", name: "Email Removal" },
          { id: "D3-RKD", name: "Registry Key Deletion" }
        ]
      },
      {
        id: "D3-PE",
        name: "Process Eviction",
        techniques: [
          { id: "D3-HS", name: "Host Shutdown" },
          { id: "D3-HR", name: "Host Reboot" },
          { id: "D3-PS", name: "Process Suspension" },
          { id: "D3-PT", name: "Process Termination" },
          { id: "D3-ST", name: "Session Termination" }
        ]
      }
    ]
  },
  {
    tactic: "Restore",
    categories: [
      {
        id: "D3-RA",
        name: "Restore Access",
        techniques: [
          { id: "D3-RIC", name: "Reissue Credential" },
          { id: "D3-RNA", name: "Restore Network Access" },
          { id: "D3-RUAA", name: "Restore User Account Access" },
          { id: "D3-ULA", name: "Unlock Account" }
        ]
      },
      {
        id: "D3-RO",
        name: "Restore Object",
        techniques: [
          { id: "D3-RC", name: "Restore Configuration" },
          { id: "D3-RD", name: "Restore Database" },
          { id: "D3-RDI", name: "Restore Disk Image" },
          { id: "D3-RF", name: "Restore File" },
          { id: "D3-RE", name: "Restore Email" },
          { id: "D3-RS", name: "Restore Software" }
        ]
      }
    ]
  }
];

export default function App() {
  const fileInputRef = useRef(null);
  const matrixRef = useRef(null);
  const layerCountRef = useRef(1);

  // --- STATE: COLLAPSIBLE COLUMNS ---
  const [collapsedTactics, setCollapsedTactics] = useState(new Set());

  const toggleTactic = (tacticName) => {
    setCollapsedTactics(prev => {
      const next = new Set(prev);
      if (next.has(tacticName)) next.delete(tacticName);
      else next.add(tacticName);
      return next;
    });
  };
  
  // --- STATE: LAYER TABS MANAGEMENT ---
  const [layers, setLayers] = useState([
    {
      id: "layer-1",
      name: "Base Defense Layer",
      techniqueData: {},
      selectedTechs: new Set(),
      gradientConfig: { min: 0, max: 100, lowColor: "#ff4444", highColor: "#44ff44" },
      activeMenu: null
    }
  ]);
  const [activeLayerId, setActiveLayerId] = useState("layer-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [contextModalTechId, setContextModalTechId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const allTechniques = useMemo(() => {
    const list = [];
    D3FEND_DATA.forEach(t => {
      t.categories.forEach(c => {
        c.techniques.forEach(tech => list.push(tech));
      });
    });
    return list;
  }, []);

  const matchCount = searchQuery 
    ? allTechniques.filter(tech => 
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tech.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).length 
    : 0;

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  const updateActiveLayer = (updates) => {
    setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, ...updates } : l));
  };

  const updateTechniqueData = (id, updates) => {
    updateActiveLayer({
      techniqueData: {
        ...activeLayer.techniqueData,
        [id]: { ...(activeLayer.techniqueData[id] || {}), ...updates }
      }
    });
  };

  const addLayer = () => {
    const newId = `layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    setLayers(prevLayers => {
      // Find the lowest available number starting from 2
      let nextNum = 2;
      const existingNames = new Set(prevLayers.map(l => l.name));
      while (existingNames.has(`New Layer ${nextNum}`)) {
        nextNum++;
      }

      return [...prevLayers, {
        id: newId, 
        name: `New Layer ${nextNum}`, 
        techniqueData: {}, 
        selectedTechs: new Set(),
        gradientConfig: { min: 0, max: 100, lowColor: "#ff4444", highColor: "#44ff44" }, 
        activeMenu: null
      }];
    });

    setActiveLayerId(newId);
  };

  const removeLayer = (id, e) => {
    e.stopPropagation();
    if (layers.length === 1) return;
    const nextLayers = layers.filter(l => l.id !== id);
    setLayers(nextLayers);
    if (activeLayerId === id) setActiveLayerId(nextLayers[0].id);
  };

  const handleSelectTechnique = (id, e) => {
    if (e.button !== 0) return;
    const next = new Set(activeLayer.selectedTechs);
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      if (next.has(id)) next.delete(id); else next.add(id);
    } else {
      if (next.has(id) && next.size === 1) next.clear();
      else { next.clear(); next.add(id); }
    }
    updateActiveLayer({ selectedTechs: next });
  };

  const applyScoreToSelected = (score) => {
    const nextData = { ...activeLayer.techniqueData };
    
    // Clamp the score between the configured min and max
    let clampedScore = Number(score);
    if (score !== '') {
      clampedScore = Math.max(activeLayer.gradientConfig.min, Math.min(activeLayer.gradientConfig.max, clampedScore));
    }

    activeLayer.selectedTechs.forEach(id => {
      if (score === '') {
        // Remove both the score and the color, but keep comments if they exist
        const current = nextData[id] || {};
        const { score: _, color: __, ...rest } = current;
        if (Object.keys(rest).length === 0) delete nextData[id];
        else nextData[id] = rest;
      } else {
        nextData[id] = {
          ...(nextData[id] || {}),
          score: clampedScore,
          color: interpolateColor(clampedScore, activeLayer.gradientConfig.min, activeLayer.gradientConfig.max, activeLayer.gradientConfig.lowColor, activeLayer.gradientConfig.highColor)
        };
      }
    });
    updateActiveLayer({ techniqueData: nextData });
  };

  const applyColorToSelected = (color) => {
    const nextData = { ...activeLayer.techniqueData };
    activeLayer.selectedTechs.forEach(id => {
      nextData[id] = { ...nextData[id], color: color || null };
    });
    updateActiveLayer({ techniqueData: nextData });
  };

  const exportJSON = () => {
    const exportData = {
      name: activeLayer.name,
      domain: "d3fend",
      gradient: activeLayer.gradientConfig,
      techniques: Object.entries(activeLayer.techniqueData).map(([id, val]) => ({ techniqueID: id, ...val }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeLayer.name}.json`; a.click();
  };

  const exportCSV = () => {
    // Define the column headers
    const headers = ["Technique ID", "Name", "Score", "Color", "Comment"];
    const rows = [headers.join(",")];
    
    // Extract only the techniques that have data applied to them
    Object.entries(activeLayer.techniqueData).forEach(([id, data]) => {
      const tech = allTechniques.find(t => t.id === id);
      if (!tech) return;
      
      // Escape names and comments in quotes to prevent internal commas from breaking the CSV layout
      const safeName = `"${tech.name}"`;
      const safeComment = data.comment ? `"${data.comment.replace(/"/g, '""')}"` : '""';
      const score = data.score !== undefined && data.score !== null ? data.score : "";
      const color = data.color || "";
      
      rows.push([id, safeName, score, color, safeComment].join(","));
    });

    // Create and trigger the download
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `${activeLayer.name}-export.csv`; 
    a.click();
  };

  const exportImage = (format = 'svg') => {
    if (!matrixRef.current) return;
    
    // 1. Tell React to strip the selection borders
    setIsExporting(true);

    // 2. Wait 150ms for the DOM to update, then capture the image
    setTimeout(async () => {
      try {
        const el = matrixRef.current;
        const options = { 
          backgroundColor: '#1c2128',
          width: el.scrollWidth,
          height: el.scrollHeight,
          // Force explicit inline styles on the clone to prevent the white cutoff box
          style: { 
            width: `${el.scrollWidth}px`,
            height: `${el.scrollHeight}px`,
            margin: 0,
            transform: 'none'
          }
        };

        const dataUrl = format === 'svg' 
          ? await toSvg(el, options)
          : await toPng(el, options);
          
        const a = document.createElement('a');
        a.download = `${activeLayer.name}-matrix.${format}`;
        a.href = dataUrl; 
        a.click();
      } catch (err) {
        console.error(err);
        alert("Failed to export image. Ensure matrix is fully loaded.");
      } finally {
        // 3. Restore the selection borders instantly
        setIsExporting(false);
      }
    }, 150);
  };

  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        const importedData = {};
        if (Array.isArray(json.techniques)) {
          json.techniques.forEach(t => {
            importedData[t.techniqueID] = {
              score: t.score !== undefined ? t.score : undefined,
              color: t.color || null,
              comment: t.comment || ""
            };
          });
        }

        const newId = `layer-${Date.now()}`;
        
        setLayers(prev => {
          let baseName = json.name || "Imported Layer";
          let newName = baseName;
          
          // Check for duplicate names and append a counter if needed
          if (prev.some(l => l.name.toLowerCase() === newName.toLowerCase())) {
            let counter = 1;
            newName = `${baseName} (${counter})`;
            while (prev.some(l => l.name.toLowerCase() === newName.toLowerCase())) {
              counter++;
              newName = `${baseName} (${counter})`;
            }
          }

          return [...prev, {
            id: newId,
            name: newName,
            techniqueData: importedData,
            selectedTechs: new Set(),
            gradientConfig: json.gradient || { min: 0, max: 100, lowColor: "#ff4444", highColor: "#44ff44" },
            activeMenu: null
          }];
        });
        
        setActiveLayerId(newId);
      } catch (err) {
        alert("Failed to parse JSON layer file.");
      }
      
      // Reset the input so the user can import the exact same file again later if needed
      event.target.value = null;
    };
    reader.readAsText(file);
  };

  const renderTechniqueCell = (tech) => {
    const state = activeLayer.techniqueData[tech.id];
    const isSelected = activeLayer.selectedTechs.has(tech.id) && !isExporting;
    const isMatch = searchQuery && (
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const bgColor = state?.color || (isSelected ? '#1f6feb' : '#22272e');
    const textColor = state?.color ? getContrastColor(bgColor) : (isSelected ? '#ffffff' : '#adbac7');

    return (
      <div 
        key={tech.id}
        onClick={(e) => handleSelectTechnique(tech.id, e)}
        onContextMenu={(e) => { e.preventDefault(); setContextModalTechId(tech.id); }}
        style={{ backgroundColor: bgColor, color: textColor }}
        className={`
          text-[10px] leading-snug p-1.5 rounded-[2px] border cursor-pointer select-none transition-all relative
          ${isSelected ? 'tech-cell-selected ring-1 ring-white border-white z-10' : 'border-[#373e47] hover:border-[#6e7681]'}
          ${isMatch ? 'ring-2 ring-yellow-400 font-bold' : ''}
        `}
      >
        <div className="flex justify-between items-start mb-0.5">
          <span className="opacity-70 text-[9px] font-mono">{tech.id}</span>
          {state?.score !== undefined && <span className="font-mono font-bold bg-black/30 px-1 rounded text-[9px]">{state.score}</span>}
        </div>
        <div className="font-medium text-left break-words pr-2">{tech.name}</div>
        
        {state?.comment && (
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-yellow-400 border-l-[8px] border-l-transparent rounded-tr-[1px]" title="Has Comments" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1c2128] text-[#adbac7] font-sans overflow-hidden">
      
      {/* HIDDEN FILE INPUT FOR IMPORT */}
      <input 
        type="file" 
        accept=".json"
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={importJSON} 
      />

      {/* TOP TAB BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 bg-[#22272e] border-b border-[#373e47] gap-3 lg:gap-0">
        
        {/* Left Side: Branding & Tabs (Strictly bounded to prevent overlap) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 flex-1 min-w-0">
          
          {/* Branding */}
          <div className="flex flex-col shrink-0">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white tracking-tight">
                MITRE <span className="text-[#388bfd]">D3FEND</span>™ Navigator
              </h1>
              <span className="bg-[#2d333b] text-[#adbac7] px-1.5 py-0.5 rounded text-[10px] font-mono ml-2 border border-[#444c56]">v1.2.0</span>
            </div>
            <span className="text-[#768390] text-xs mt-0.5 hidden lg:block">A knowledge graph of cybersecurity countermeasures</span>
          </div>

          {/* Layer Tabs (Scrolls cleanly if there are too many) */}
          <div className="flex items-center gap-1 overflow-x-auto min-w-0 hide-scrollbar pb-1 lg:pb-0">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-t-2 transition-colors shrink-0 ${
                  activeLayerId === layer.id
                    ? 'border-[#58a6ff] bg-[#22272e] text-white'
                    : 'border-transparent bg-[#1c2128] text-[#768390] hover:text-[#adbac7] hover:bg-[#2d333b]'
                }`}
              >
                {layer.name}
                {layers.length > 1 && (
                  <X 
                    size={14} 
                    className="hover:text-red-400 ml-1 opacity-50 hover:opacity-100" 
                    onClick={(e) => removeLayer(layer.id, e)}
                  />
                )}
              </button>
            ))}
            <button onClick={addLayer} className="p-1.5 text-[#768390] hover:text-white hover:bg-[#2d333b] rounded shrink-0">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Right Side: Action Buttons (Locked width) */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto hide-scrollbar pb-1 lg:pb-0 pl-0 lg:pl-4">
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#373e47] rounded transition-colors text-sm whitespace-nowrap"><Upload size={14} /> Import</button>
          <button onClick={() => exportImage('svg')} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#373e47] rounded transition-colors text-sm whitespace-nowrap"><ImageIcon size={14} /> SVG</button>
          <button onClick={() => exportImage('png')} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#373e47] rounded transition-colors text-sm whitespace-nowrap"><ImageIcon size={14} /> PNG</button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#373e47] rounded transition-colors text-sm whitespace-nowrap"><Download size={14} /> CSV</button>
          <button onClick={exportJSON} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded font-semibold transition-colors text-sm whitespace-nowrap"><Download size={14} /> JSON</button>
          <button onClick={() => setIsChangelogOpen(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#373e47] rounded transition-colors text-sm whitespace-nowrap ml-2"><FileText size={14} /> Changelog</button>
          <button onClick={() => setIsHelpOpen(true)} className="p-1.5 text-[#768390] hover:text-white transition-colors ml-1"><HelpCircle size={18} /></button>
        </div>
      </div>

      {/* SECONDARY CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between px-4 py-2 bg-[#22272e] border-b border-[#373e47] gap-3 lg:gap-0">
        <div className="flex items-center gap-5 lg:gap-6 text-sm font-medium text-[#adbac7] overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
          <span 
            onClick={() => updateActiveLayer({ activeMenu: activeLayer.activeMenu === 'selection' ? null : 'selection' })}
            className={`cursor-pointer transition-colors whitespace-nowrap ${activeLayer.activeMenu === 'selection' ? 'text-white border-b-2 border-[#58a6ff] pb-1' : 'hover:text-white'}`}
          >
            Selection Controls
          </span>
          <span 
            onClick={() => updateActiveLayer({ activeMenu: activeLayer.activeMenu === 'layer' ? null : 'layer' })}
            className={`cursor-pointer transition-colors whitespace-nowrap ${activeLayer.activeMenu === 'layer' ? 'text-white border-b-2 border-[#58a6ff] pb-1' : 'hover:text-white'}`}
          >
            Layer Controls
          </span>
          <span 
            onClick={() => updateActiveLayer({ activeMenu: activeLayer.activeMenu === 'technique' ? null : 'technique' })}
            className={`cursor-pointer transition-colors whitespace-nowrap ${activeLayer.activeMenu === 'technique' ? 'text-white border-b-2 border-[#58a6ff] pb-1' : 'hover:text-white'}`}
          >
            Technique Controls ({activeLayer.selectedTechs.size})
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          {searchQuery && (
            <span className="text-xs text-yellow-400 font-medium whitespace-nowrap">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
          <div className="relative flex-1 lg:w-auto">
            <Search size={14} className="absolute left-2.5 top-2 text-[#768390]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-64 bg-[#0d1117] border border-[#373e47] rounded py-1 pl-8 pr-8 text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] text-white placeholder-[#768390] transition-all"
            />
            {searchQuery && (
              <X 
                size={14} 
                className="absolute right-2.5 top-2 text-[#768390] hover:text-white cursor-pointer" 
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS SUB-PANEL */}
      {activeLayer.activeMenu && (
        <div className="bg-[#1c2128] border-b border-[#373e47] p-3 px-4 lg:px-6 text-xs flex items-center overflow-x-auto hide-scrollbar">
          
          {activeLayer.activeMenu === 'selection' && (
            <div className="flex gap-3 min-w-max">
              <button onClick={() => updateActiveLayer({ selectedTechs: new Set(allTechniques.map(t => t.id)) })} className="px-2 py-1 bg-[#2d333b] hover:bg-[#373e47] text-white rounded">Select All</button>
              <button onClick={() => updateActiveLayer({ selectedTechs: new Set() })} className="px-2 py-1 bg-[#2d333b] hover:bg-[#373e47] text-white rounded">Deselect All</button>
            </div>
          )}

          {activeLayer.activeMenu === 'layer' && (
            <div className="flex items-center gap-6 min-w-max">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={activeLayer.name} 
                  onChange={(e) => updateActiveLayer({ name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.target.blur();
                  }}
                  onBlur={(e) => {
                    let newName = e.target.value.trim();
                    if (!newName) newName = "Untitled Layer";
                    
                    // Check if another layer already has this exact name (ignoring case)
                    let isDuplicate = layers.some(l => l.id !== activeLayer.id && l.name.toLowerCase() === newName.toLowerCase());
                    
                    if (isDuplicate) {
                      let counter = 1;
                      let uniqueName = `${newName} (${counter})`;
                      // Increment the counter until we find an available name
                      while (layers.some(l => l.id !== activeLayer.id && l.name.toLowerCase() === uniqueName.toLowerCase())) {
                        counter++;
                        uniqueName = `${newName} (${counter})`;
                      }
                      newName = uniqueName;
                    }
                    updateActiveLayer({ name: newName });
                  }}
                  className={`bg-[#2d333b] border ${
                    layers.some(l => l.id !== activeLayer.id && l.name.trim().toLowerCase() === activeLayer.name.trim().toLowerCase())
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#444c56] focus:border-[#388bfd]'
                  } text-white px-2 py-0.5 rounded w-48 focus:outline-none`} 
                />
                {layers.some(l => l.id !== activeLayer.id && l.name.trim().toLowerCase() === activeLayer.name.trim().toLowerCase()) && (
                  <span className="text-[10px] text-red-400 font-medium">Name in use</span>
                )}
              </div>
              <div className="flex items-center gap-3 border-l border-[#373e47] pl-6">
                <Palette size={13} />
                {['min', 'max'].map(bound => (
                  <div key={bound} className="flex items-center gap-1.5">
                    <span>{bound === 'min' ? 'Low' : 'High'}:</span>
                    <input type="color" value={bound === 'min' ? activeLayer.gradientConfig.lowColor : activeLayer.gradientConfig.highColor} onChange={(e) => updateActiveLayer({ gradientConfig: { ...activeLayer.gradientConfig, [bound === 'min' ? 'lowColor' : 'highColor']: e.target.value }})} className="w-5 h-5 bg-transparent border-0 cursor-pointer" />
                    <input type="number" value={activeLayer.gradientConfig[bound]} onChange={(e) => updateActiveLayer({ gradientConfig: { ...activeLayer.gradientConfig, [bound]: Number(e.target.value) }})} className="w-12 bg-[#2d333b] border border-[#444c56] text-white px-1 py-0.5 rounded text-center" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLayer.activeMenu === 'technique' && (
            <div className="flex items-center gap-8 min-w-max">
              <div className="flex items-center gap-2">
                <span className="text-white">Score:</span>
                <input 
                  type="number" 
                  min={activeLayer.gradientConfig.min}
                  max={activeLayer.gradientConfig.max}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') {
                      applyScoreToSelected(e.target.value);
                      e.target.value = ''; // Optional: clear input after pressing enter
                    }
                  }} 
                  className="w-16 bg-[#2d333b] border border-[#444c56] text-white px-2 py-0.5 rounded focus:outline-none focus:border-[#1f6feb]" 
                />
                <button onClick={() => applyScoreToSelected('')} className="px-2 py-0.5 bg-red-900/60 text-red-200 rounded">Clear</button>
              </div>
              <div className="flex items-center gap-3 border-l border-[#373e47] pl-8">
                <span className="text-white flex items-center gap-1"><Palette size={14} /> Color:</span>
                <div className="grid grid-cols-5 gap-1 bg-[#2d333b] p-1.5 rounded border border-[#444c56]">
                  {PREDEFINED_COLORS.map(color => (
                    <button key={color} onClick={() => applyColorToSelected(color)} style={{ backgroundColor: color }} className="w-4 h-4 border border-black/50 hover:border-white hover:scale-110 rounded-sm" />
                  ))}
                </div>
                <button onClick={() => applyColorToSelected(null)} className="px-2.5 py-1 bg-[#2d333b] text-[#adbac7] rounded text-[11px] border border-[#444c56] ml-2">No Color</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MATRIX GRID - Replaced justify-center to anchor left */}
      <div className="flex-1 overflow-auto bg-[#1c2128] p-4">
        <div ref={matrixRef} className="inline-flex gap-1.5 bg-[#1c2128] p-2">
          {D3FEND_DATA.map((tacticObj) => {
            const isCollapsed = collapsedTactics.has(tacticObj.tactic) && !isExporting;
            
            // 1. Scan this tactic to see if it contains a search match
            let hasSearchMatch = false;
            if (searchQuery) {
              const lowerQuery = searchQuery.toLowerCase();
              hasSearchMatch = tacticObj.categories.some(c => 
                c.techniques.some(t => 
                  t.name.toLowerCase().includes(lowerQuery) || 
                  t.id.toLowerCase().includes(lowerQuery)
                )
              );
            }
            
            // Extract colors for the collapsed summary
            const tacticColors = [];
            tacticObj.categories.forEach(c => {
              c.techniques.forEach(t => {
                const state = activeLayer.techniqueData[t.id];
                if (state && state.color) tacticColors.push(state.color);
              });
            });
            
            return (
              <div 
                key={tacticObj.tactic} 
                className={`flex flex-col border rounded-sm transition-all overflow-hidden ${
                  isCollapsed ? 'w-12 bg-[#22272e] hover:bg-[#2d333b] cursor-pointer' : 'h-fit bg-[#22272e]'
                } ${isCollapsed && hasSearchMatch ? 'ring-2 ring-yellow-400 border-transparent z-10' : 'border-[#373e47]'}`}
                onClick={isCollapsed ? () => toggleTactic(tacticObj.tactic) : undefined}
                title={isCollapsed ? `Expand ${tacticObj.tactic}` : undefined}
              >
                {!isCollapsed ? (
                  // --- EXPANDED VIEW ---
                  <>
                    <div 
                      onClick={() => toggleTactic(tacticObj.tactic)}
                      className="bg-[#2d333b] border-b border-[#373e47] py-1.5 px-2 font-bold text-white text-xs uppercase cursor-pointer hover:bg-[#373e47] flex items-center justify-center relative select-none"
                      title={`Collapse ${tacticObj.tactic}`}
                    >
                      <span>{tacticObj.tactic}</span>
                      <ChevronDown size={14} className="text-[#768390] absolute right-2" />
                    </div>
                    <div className="flex gap-1 p-1 bg-[#151b23]">
                      {tacticObj.categories.map((category) => (
                        <div key={category.name} className="w-36 flex flex-col">
                          <div className="bg-[#21262d] text-[#cdd9e5] text-center font-semibold text-[11px] py-1 px-1 border border-[#373e47] mb-1 min-h-[36px] flex items-center justify-center leading-tight">
                            {category.name}
                          </div>
                          <div className="flex flex-col gap-1">
                            {category.techniques.map(tech => renderTechniqueCell(tech))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // --- COLLAPSED VIEW ---
                  <div className="flex flex-col items-center justify-start h-full pt-4 pb-6 select-none overflow-hidden">
                    <ChevronRight size={16} className={`${hasSearchMatch ? 'text-yellow-400' : 'text-[#768390]'} mb-4 shrink-0`} />
                    
                    {/* Indicator map for hidden colored techniques */}
                    {tacticColors.length > 0 && (
                      <div className="flex flex-col gap-[2px] w-6 mb-4 shrink-0">
                        {tacticColors.map((color, idx) => (
                          <div key={idx} className="w-full h-1.5 rounded-[1px]" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    )}

                    <span 
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} 
                      className={`${hasSearchMatch ? 'text-yellow-400' : 'text-[#adbac7]'} font-bold text-xs uppercase tracking-[0.25em] whitespace-nowrap`}
                    >
                      {tacticObj.tactic}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTEXT MENU MODAL */}
      {contextModalTechId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in duration-150">
          <div className="bg-[#22272e] border border-[#444c56] p-5 rounded-lg shadow-2xl w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">{contextModalTechId} Metadata</h3>
              <button onClick={() => setContextModalTechId(null)} className="text-[#768390] hover:text-white"><X size={16} /></button>
            </div>
            
            <label className="block text-xs font-semibold text-[#adbac7] mb-1">Annotations / Comments</label>
            <textarea 
              autoFocus
              className="w-full bg-[#1c2128] border border-[#444c56] text-white rounded p-2 text-sm mb-4 min-h-[100px] focus:border-blue-500 outline-none"
              placeholder="Add links, external references, or configuration notes..."
              value={activeLayer.techniqueData[contextModalTechId]?.comment || ""}
              onChange={(e) => updateTechniqueData(contextModalTechId, { comment: e.target.value })}
            />
            
            <div className="flex justify-end gap-2">
              <button onClick={() => updateTechniqueData(contextModalTechId, { comment: "" })} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded">Clear</button>
              <button onClick={() => setContextModalTechId(null)} className="px-4 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded text-xs font-semibold">Done</button>
            </div>
          </div>
        </div>
      )}
      {/* CHANGELOG MODAL */}
      {isChangelogOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center animate-in fade-in duration-150">
          <div className="bg-[#22272e] border border-[#444c56] rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-[#373e47]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-[#768390]" />
                Version History
              </h2>
              <button onClick={() => setIsChangelogOpen(false)} className="text-[#768390] hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto text-sm text-[#adbac7] space-y-6">

            {/* --- v1.2.0 --- */}
              <section>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-bold text-white text-base">v1.2.0</h3>
                  <span className="text-xs text-[#768390]">Mobile Layout & Export Update</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Added a dedicated PNG export button for native mobile viewing and easier sharing.</li>
                  <li>Implemented full mobile responsiveness with horizontally scrollable tabs, action buttons, and control menus.</li>
                  <li>Preserved the strict desktop layout to ensure complete visual consistency on larger screens.</li>
                  <li>Fixed an issue where secondary control panels and color pickers were being clipped on smaller devices.</li>
                </ul>
              </section>
              
              {/* --- v1.1.0 --- */}
              <section>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-bold text-white text-base">v1.1.0</h3>
                  <span className="text-xs text-[#768390]">Feature Update & Bug Fixes</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Added CSV Export functionality to generate spreadsheet-ready reports of scored and annotated techniques.</li>
                  <li>Added collapsible tactic columns to save screen space, complete with a color-coded mini-map indicator for hidden scored techniques.</li>
                  <li>Enhanced the search engine to visually highlight collapsed tactic columns if they contain a matching technique.</li>
                  <li>Improved image exports (SVG/PNG) to automatically expand all collapsed columns for complete documentation.</li>
                  <li>Fixed a state batching bug that caused duplicate layer names when rapidly adding or deleting tabs.</li>
                </ul>
              </section>

              {/* --- v1.0.0 --- */}
              <section>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-bold text-white text-base">v1.0.0</h3>
                  <span className="text-xs text-[#768390]">Initial Release</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Added comprehensive D3FEND technique matrix mapping (Model, Harden, Detect, Isolate, Deceive, Evict, Restore).</li>
                  <li>Implemented multi-layer tab support with dynamic sequential numbering.</li>
                  <li>Added cell scoring capabilities with automatic gradient color mapping.</li>
                  <li>Enabled JSON import and export functionalities for saving local layer configurations.</li>
                  <li>Added SVG and PNG export tools for high-resolution matrix capturing.</li>
                  <li>Integrated right-click metadata system for custom user annotations and URL references.</li>
                  <li>Implemented persistent, state-based selection controls.</li>
                </ul>
              </section>

            </div>

            <div className="p-4 border-t border-[#373e47] bg-[#1c2128] flex justify-end rounded-b-lg">
              <button onClick={() => setIsChangelogOpen(false)} className="px-5 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#373e47] text-white rounded font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HELP MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center animate-in fade-in duration-150">
          <div className="bg-[#22272e] border border-[#444c56] rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-[#373e47]">
              <h2 className="text-lg font-bold text-white">How to use D3FEND Navigator</h2>
              <button onClick={() => setIsHelpOpen(false)} className="text-[#768390] hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto text-sm text-[#adbac7] space-y-5">
              <section>
                <h3 className="font-semibold text-white mb-1.5">Selecting Techniques</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Left-click</strong> any technique in the matrix to select it.</li>
                  <li>Hold <strong>Ctrl</strong> or <strong>Shift</strong> while clicking to select multiple techniques at once.</li>
                  <li>Use the <strong>Selection Controls</strong> menu at the top to quickly Select All or Deselect All.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-1.5">Scoring & Coloring</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Open the <strong>Technique Controls</strong> menu to apply a score or a manual background color to your selected techniques.</li>
                  <li>Scores are automatically translated into colors based on the gradient configured in the <strong>Layer Controls</strong> menu.</li>
                  <li>Text color automatically switches between black and white to ensure readability against your chosen background.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-1.5">Annotations & Comments</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Right-click</strong> (or <strong>long-press</strong> on mobile) any technique cell to open the Metadata menu.</li>
                  <li>Here you can add notes, external URLs, or ticket references.</li>
                  <li>Techniques with active comments will display a small yellow triangle in the top right corner.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-1.5">Navigation & Search</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Search:</strong> Find techniques by ID or name. Matches highlight in yellow, and even collapsed columns will glow if they hide a match.</li>
                  <li><strong>Collapsible Columns:</strong> Click on any tactic header (e.g., MODEL, HARDEN) to collapse the column and save screen space. Hidden scored techniques are displayed as a color-coded mini-map!</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-1.5">Saving & Exporting</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Tabs:</strong> Use the `+` button in the top left to create multiple independent matrix layers.</li>
                  <li><strong>Import / Export JSON:</strong> Save your exact layer state (scores, colors, comments) locally and restore it later.</li>
                  <li><strong>SVG & PNG:</strong> Export high-resolution snapshots of your matrix. Collapsed columns will automatically expand for the picture!</li>
                  <li><strong>CSV:</strong> Generate a spreadsheet-ready report of all your currently scored and annotated techniques.</li>
                </ul>
              </section>
            </div>

            <div className="p-4 border-t border-[#373e47] bg-[#1c2128] flex justify-end rounded-b-lg">
              <button onClick={() => setIsHelpOpen(false)} className="px-5 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded font-semibold transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER LEGEND & DISCLAIMER */}
      <div className="bg-[#151b23] border-t border-[#373e47] flex flex-col">
        <div className="px-4 py-1 flex items-center justify-between text-[11px] text-[#768390]">
          <div className="flex gap-4">
            <span>Techniques: {allTechniques.length}</span>
            <span>Selected: {activeLayer.selectedTechs.size}</span>
            <span>Scored: {Object.values(activeLayer.techniqueData).filter(t => t.score !== undefined && t.score !== null).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{activeLayer.gradientConfig.min}</span>
            <div className="w-24 h-2.5 rounded-sm border border-[#373e47]" style={{ background: `linear-gradient(to right, ${activeLayer.gradientConfig.lowColor}, ${activeLayer.gradientConfig.highColor})` }} />
            <span>{activeLayer.gradientConfig.max}</span>
          </div>
        </div>
        {/* Unofficial Tool Disclaimer */}
        <div className="px-4 pb-1 text-center text-[10px] text-[#768390]/60">
          This is an unofficial community tool. D3FEND™ is a trademark of The MITRE Corporation.
        </div>
      </div>
    </div>
  );
}