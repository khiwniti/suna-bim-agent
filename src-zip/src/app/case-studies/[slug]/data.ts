/**
 * Case Study Data
 *
 * Contains all case study content used across the case studies section.
 * Extracted to a separate file for reusability and maintainability.
 */

import {
  Building2,
  PenTool,
  Landmark,
  TrendingDown,
  Award,
  Clock,
  Lightbulb,
  BarChart3,
  FileText,
  Zap,
  Users,
  Download,
} from 'lucide-react';
import React from 'react';

// ============================================
// Types
// ============================================

export interface CaseStudyResult {
  metric: string;
  value: string;
  description: string;
  iconName: string;
}

export interface CaseStudyFeature {
  iconName: string;
  title: string;
  description: string;
}

export interface CaseStudyStep {
  step: string;
  title: string;
  description: string;
}

export interface CaseStudyMetric {
  before: string;
  after: string;
  improvement: string;
  label: string;
}

export interface CaseStudyDetail {
  id: string;
  slug: string;
  category: string;
  categoryIconName: string;
  title: string;
  titleTh: string;
  subtitle: string;
  company: string;
  companyType: string;
  companySize: string;
  location: string;
  industry: string;
  heroImage: string;
  results: CaseStudyResult[];
  challenge: {
    title: string;
    description: string;
    painPoints: string[];
  };
  solution: {
    title: string;
    description: string;
    features: CaseStudyFeature[];
  };
  implementation: {
    title: string;
    timeline: string;
    steps: CaseStudyStep[];
  };
  outcomes: {
    title: string;
    description: string;
    metrics: CaseStudyMetric[];
  };
  testimonial: {
    quote: string;
    quoteTh: string;
    author: string;
    role: string;
    avatar: string;
  };
  keyTakeaways: string[];
  tags: string[];
  readTime: string;
  publishDate: string;
}

// Icon mapping for serialization
export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  PenTool,
  Landmark,
  TrendingDown,
  Award,
  Clock,
  Lightbulb,
  BarChart3,
  FileText,
  Zap,
  Users,
  Download,
};

// ============================================
// Case Study Data
// ============================================

export const CASE_STUDIES: Record<string, CaseStudyDetail> = {
  'abc-construction-green-contracts': {
    id: 'smb-contractor',
    slug: 'abc-construction-green-contracts',
    category: 'SMB Contractor',
    categoryIconName: 'Building2',
    title: 'How ABC Construction Won 3 Green Building Contracts',
    titleTh: 'ABC Construction ชนะ 3 โครงการ Green Building ได้อย่างไร',
    subtitle: 'A small Thai contractor used BIM Carbon to differentiate from competitors and win ฿45M in green building projects within 6 months.',
    company: 'ABC Construction Co., Ltd.',
    companyType: 'General Contractor',
    companySize: '25 employees',
    location: 'Bangkok, Thailand',
    industry: 'Commercial Construction',
    heroImage: '/images/case-studies/abc-construction-hero.jpg',
    results: [
      { metric: '3', value: 'Green Contracts', description: 'Won in 6 months', iconName: 'Award' },
      { metric: '฿45M', value: 'Project Value', description: 'Total contracts', iconName: 'BarChart3' },
      { metric: '85%', value: 'Time Saved', description: 'On carbon reports', iconName: 'Clock' },
      { metric: '15min', value: 'Report Time', description: 'Per project', iconName: 'Zap' },
    ],
    challenge: {
      title: 'The Challenge',
      description: 'ABC Construction, a 25-person contracting firm in Bangkok, was losing bids to larger competitors who could afford expensive carbon consultants. With green building requirements becoming standard in government and corporate projects, they needed a way to provide carbon analysis without the ฿50,000-200,000 cost per project.',
      painPoints: [
        'Lost 5 green building bids in one year due to lack of carbon documentation',
        'Consultant fees of ฿80,000 per project made competitive pricing impossible',
        'Manual carbon calculations took 2-3 weeks per project',
        'No in-house expertise for TGO-compliant reporting',
        'Clients demanding sustainability credentials they couldn\'t provide',
      ],
    },
    solution: {
      title: 'The Solution',
      description: 'ABC Construction adopted BIM Carbon\'s Pro plan to generate instant carbon analysis and TGO-compliant reports. The Thai-specific material database and AI recommendations gave them the competitive edge they needed.',
      features: [
        {
          iconName: 'FileText',
          title: 'TGO-Compliant Reports',
          description: 'Generated professional carbon footprint reports in 15 minutes that met government tender requirements.',
        },
        {
          iconName: 'BarChart3',
          title: 'Thai Material Database',
          description: 'Used 104+ local emission factors for accurate estimates that clients trusted.',
        },
        {
          iconName: 'Lightbulb',
          title: 'AI Optimization',
          description: 'Received instant recommendations for lower-carbon materials with cost comparisons.',
        },
        {
          iconName: 'Zap',
          title: 'Instant Analysis',
          description: 'Uploaded IFC models and received comprehensive analysis within minutes.',
        },
      ],
    },
    implementation: {
      title: 'Implementation',
      timeline: '2 weeks from signup to first client presentation',
      steps: [
        {
          step: '01',
          title: 'Onboarding',
          description: 'Team completed the 30-minute video tutorial and uploaded their first project.',
        },
        {
          step: '02',
          title: 'First Analysis',
          description: 'Generated carbon report for ongoing project to test accuracy with known data.',
        },
        {
          step: '03',
          title: 'Client Presentation',
          description: 'Included BIM Carbon report in next tender, impressing the evaluation committee.',
        },
        {
          step: '04',
          title: 'Won First Contract',
          description: 'Secured ฿12M office renovation project partly due to carbon documentation.',
        },
      ],
    },
    outcomes: {
      title: 'The Outcomes',
      description: 'Within 6 months, ABC Construction transformed from losing green building bids to becoming a go-to contractor for sustainability-focused projects.',
      metrics: [
        { before: '0%', after: '60%', improvement: '+60%', label: 'Green bid win rate' },
        { before: '฿80,000', after: '฿1,990', improvement: '-97%', label: 'Cost per carbon report' },
        { before: '2-3 weeks', after: '15 minutes', improvement: '-99%', label: 'Report generation time' },
        { before: '0', after: '3', improvement: '+3', label: 'Green certifications supported' },
      ],
    },
    testimonial: {
      quote: 'Before BIM Carbon, we couldn\'t compete for green building projects. Now we\'re winning them. The Thai material database and instant reports give us credibility that larger competitors envy.',
      quoteTh: 'ก่อนใช้ BIM Carbon เราแข่งขันโครงการ Green Building ไม่ได้เลย ตอนนี้เราชนะ ฐานข้อมูลวัสดุไทยและรายงานทันทีทำให้เรามีความน่าเชื่อถือที่คู่แข่งรายใหญ่ยังอิจฉา',
      author: 'คุณสมชาย วงศ์ประเสริฐ',
      role: 'Managing Director, ABC Construction',
      avatar: '/images/testimonials/somchai.jpg',
    },
    keyTakeaways: [
      'SMB contractors can compete with larger firms by leveraging technology for carbon analysis',
      'Thai-specific emission factors are crucial for credibility with local clients',
      'Speed matters: Being able to include carbon analysis in tight bid timelines wins contracts',
      'ROI is immediate: ฿1,990/month vs ฿80,000 per consultant engagement',
      'Green building credentials open doors to previously inaccessible project types',
    ],
    tags: ['SMB', 'Green Building', 'TGO Compliance', 'Competitive Advantage', 'Bangkok'],
    readTime: '5 min read',
    publishDate: '2025-01-15',
  },

  'studio-verde-carbon-optimization': {
    id: 'architect',
    slug: 'studio-verde-carbon-optimization',
    category: 'Architecture Firm',
    categoryIconName: 'PenTool',
    title: 'Design Optimization: Saving 30% Embodied Carbon',
    titleTh: 'การออกแบบที่ลดคาร์บอนได้ 30%',
    subtitle: 'How Studio Verde used AI recommendations to redesign a 50,000 sqm office building and achieve TREES-NC Gold certification on their first attempt.',
    company: 'Studio Verde Architects',
    companyType: 'Architecture Firm',
    companySize: '12 architects',
    location: 'Chiang Mai, Thailand',
    industry: 'Commercial Architecture',
    heroImage: '/images/case-studies/studio-verde-hero.jpg',
    results: [
      { metric: '30%', value: 'Carbon Reduced', description: 'vs original design', iconName: 'TrendingDown' },
      { metric: 'Gold', value: 'TREES-NC', description: 'First attempt', iconName: 'Award' },
      { metric: '฿2.1M', value: 'Material Savings', description: 'Through optimization', iconName: 'BarChart3' },
      { metric: '12', value: 'Design Iterations', description: 'AI-guided', iconName: 'Lightbulb' },
    ],
    challenge: {
      title: 'The Challenge',
      description: 'Studio Verde was designing a 50,000 sqm office complex in Chiang Mai with ambitious sustainability goals. The client wanted TREES-NC Gold certification, but the initial design had an embodied carbon footprint too high to qualify. Traditional consultants quoted ฿200,000 and 6 weeks for optimization analysis.',
      painPoints: [
        'Initial design exceeded TREES carbon thresholds by 35%',
        'No clear path to identify which materials were biggest contributors',
        'Client deadline left only 4 weeks for design optimization',
        'Budget didn\'t allow for expensive sustainability consultants',
        'Team lacked experience with embodied carbon optimization',
      ],
    },
    solution: {
      title: 'The Solution',
      description: 'Using BIM Carbon\'s AI-powered optimization engine, Studio Verde ran rapid design iterations to identify the optimal material combinations for their target carbon footprint while maintaining structural and aesthetic requirements.',
      features: [
        {
          iconName: 'Lightbulb',
          title: 'AI Material Recommendations',
          description: 'Received instant alternatives for high-carbon materials with Thai availability.',
        },
        {
          iconName: 'BarChart3',
          title: 'Real-time Carbon Tracking',
          description: 'Watched carbon footprint change as they modified the design in real-time.',
        },
        {
          iconName: 'Award',
          title: 'TREES Credit Calculator',
          description: 'Automatic calculation of TREES-NC credits based on current design.',
        },
        {
          iconName: 'FileText',
          title: 'Certification Documentation',
          description: 'Generated TREES-ready reports for submission without additional work.',
        },
      ],
    },
    implementation: {
      title: 'Implementation',
      timeline: '4 weeks from analysis to TREES submission',
      steps: [
        {
          step: '01',
          title: 'Baseline Analysis',
          description: 'Uploaded IFC model and established initial carbon footprint of 485 kgCO2e/m².',
        },
        {
          step: '02',
          title: 'Hotspot Identification',
          description: 'AI identified concrete specification and façade system as 65% of total carbon.',
        },
        {
          step: '03',
          title: 'Design Iterations',
          description: 'Tested 12 alternative combinations, settling on fly ash concrete and timber hybrid system.',
        },
        {
          step: '04',
          title: 'TREES Submission',
          description: 'Generated certification package and submitted for Gold certification.',
        },
      ],
    },
    outcomes: {
      title: 'The Outcomes',
      description: 'Studio Verde achieved TREES-NC Gold on their first submission and established a repeatable process for sustainable design that has since won them 4 additional green building commissions.',
      metrics: [
        { before: '485 kgCO2e/m²', after: '340 kgCO2e/m²', improvement: '-30%', label: 'Embodied carbon' },
        { before: '35% over', after: 'Gold achieved', improvement: 'Target met', label: 'TREES threshold' },
        { before: '฿200,000', after: '฿1,990', improvement: '-99%', label: 'Analysis cost' },
        { before: '6 weeks', after: '4 weeks', improvement: '-33%', label: 'Optimization time' },
      ],
    },
    testimonial: {
      quote: 'The AI suggestions showed us alternatives we never considered. Switching to fly ash concrete and optimizing the structural grid reduced carbon by 30% while actually saving construction cost. We achieved TREES Gold on our first submission.',
      quoteTh: 'AI แนะนำทางเลือกที่เราไม่เคยคิดถึง การเปลี่ยนไปใช้คอนกรีตผสมเถ้าลอยและปรับระบบโครงสร้างช่วยลดคาร์บอน 30% และยังประหยัดต้นทุนก่อสร้างด้วย เราได้ TREES Gold ในการยื่นครั้งแรก',
      author: 'Khun Naree Suwannapong',
      role: 'Principal Architect, Studio Verde',
      avatar: '/images/testimonials/naree.jpg',
    },
    keyTakeaways: [
      'AI-powered optimization can identify material substitutions humans might miss',
      'Real-time carbon tracking enables rapid design iteration',
      'TREES certification is achievable with the right tools, even for smaller firms',
      'Carbon optimization often aligns with cost optimization',
      'Speed of analysis enables more thorough exploration within project timelines',
    ],
    tags: ['Architecture', 'TREES Certification', 'AI Optimization', 'Material Selection', 'Chiang Mai'],
    readTime: '6 min read',
    publishDate: '2025-01-22',
  },

  'green-heights-financing': {
    id: 'developer',
    slug: 'green-heights-financing',
    category: 'Property Developer',
    categoryIconName: 'Landmark',
    title: 'Accessing Green Financing with Automated Reports',
    titleTh: 'เข้าถึงสินเชื่อสีเขียวด้วยรายงานอัตโนมัติ',
    subtitle: 'Green Heights Development secured ฿500M in green bonds by providing TGO-compliant carbon documentation across their entire 5-project portfolio.',
    company: 'Green Heights Development',
    companyType: 'Property Developer',
    companySize: '5 active projects',
    location: 'Bangkok, Thailand',
    industry: 'Residential & Mixed-Use Development',
    heroImage: '/images/case-studies/green-heights-hero.jpg',
    results: [
      { metric: '฿500M', value: 'Green Financing', description: 'Bond issuance', iconName: 'Landmark' },
      { metric: '0.5%', value: 'Lower Interest', description: 'vs conventional', iconName: 'TrendingDown' },
      { metric: '5', value: 'Projects', description: 'All certified', iconName: 'Building2' },
      { metric: '10 days', value: 'Documentation', description: 'For all projects', iconName: 'Clock' },
    ],
    challenge: {
      title: 'The Challenge',
      description: 'Green Heights Development wanted to issue Thailand\'s first mid-sized green bond for residential development. Banks required comprehensive carbon documentation for all 5 projects in their portfolio, a task that would traditionally take 3-4 months and cost over ฿1M in consultant fees.',
      painPoints: [
        'Banks required TGO-compliant carbon reports for green bond eligibility',
        'Traditional consultants quoted ฿200,000+ per project, ฿1M+ total',
        'Timeline of 3-4 months didn\'t align with bond market window',
        'Each project needed consistent methodology for portfolio reporting',
        'Annual ESG reporting would require ongoing carbon tracking',
      ],
    },
    solution: {
      title: 'The Solution',
      description: 'Green Heights used BIM Carbon\'s Enterprise plan to generate standardized carbon reports across all 5 projects. The consistent methodology and TGO-aligned format satisfied bank requirements and enabled rapid documentation.',
      features: [
        {
          iconName: 'FileText',
          title: 'TGO-Compliant Reports',
          description: 'Generated investor-grade carbon documentation meeting Thai green bond standards.',
        },
        {
          iconName: 'Users',
          title: 'Portfolio Dashboard',
          description: 'Tracked carbon metrics across all 5 projects in a single dashboard.',
        },
        {
          iconName: 'BarChart3',
          title: 'Consistent Methodology',
          description: 'Applied standardized calculation methodology across entire portfolio.',
        },
        {
          iconName: 'Download',
          title: 'White-Label Reports',
          description: 'Generated branded reports suitable for investor presentations.',
        },
      ],
    },
    implementation: {
      title: 'Implementation',
      timeline: '10 days from project upload to bank submission',
      steps: [
        {
          step: '01',
          title: 'Portfolio Setup',
          description: 'Uploaded IFC models and project data for all 5 developments.',
        },
        {
          step: '02',
          title: 'Batch Analysis',
          description: 'Generated carbon reports for all projects simultaneously.',
        },
        {
          step: '03',
          title: 'Report Customization',
          description: 'Added company branding and executive summaries for investor package.',
        },
        {
          step: '04',
          title: 'Bank Submission',
          description: 'Submitted documentation package to green bond underwriters.',
        },
      ],
    },
    outcomes: {
      title: 'The Outcomes',
      description: 'Green Heights successfully issued ฿500M in green bonds, securing 0.5% lower interest rates that will save ฿12.5M over the 5-year bond term. They\'ve since used BIM Carbon for ongoing ESG reporting.',
      metrics: [
        { before: '฿1M+', after: '฿59,400', improvement: '-94%', label: 'Documentation cost' },
        { before: '3-4 months', after: '10 days', improvement: '-92%', label: 'Time to documentation' },
        { before: 'Standard rates', after: '0.5% lower', improvement: '฿12.5M savings', label: '5-year interest savings' },
        { before: 'Manual', after: 'Automated', improvement: 'Ongoing', label: 'ESG reporting' },
      ],
    },
    testimonial: {
      quote: 'Banks require carbon documentation for green loans. With traditional consultants, we would have missed the bond market window. BIM Carbon gave us investor-ready reports in days, not months, and the savings on interest rates paid for 10 years of subscription in the first year alone.',
      quoteTh: 'ธนาคารต้องการเอกสารคาร์บอนสำหรับสินเชื่อสีเขียว ถ้าใช้ที่ปรึกษาแบบเดิม เราจะพลาดช่วงเวลาออกพันธบัตร BIM Carbon ให้รายงานพร้อมนำเสนอนักลงทุนในไม่กี่วัน ไม่ใช่หลายเดือน และส่วนต่างดอกเบี้ยที่ประหยัดได้จ่ายค่าสมาชิก 10 ปีในปีแรกปีเดียว',
      author: 'Khun Prasert Charoenwong',
      role: 'CFO, Green Heights Development',
      avatar: '/images/testimonials/prasert.jpg',
    },
    keyTakeaways: [
      'Green financing offers significant cost advantages (0.5% lower rates = ฿12.5M savings)',
      'Speed is critical for accessing time-sensitive financing windows',
      'Consistent methodology across portfolio simplifies investor due diligence',
      'Automated reporting enables ongoing ESG compliance without incremental cost',
      'White-label reports enhance investor presentation quality',
    ],
    tags: ['Green Finance', 'TGO Reports', 'ESG Compliance', 'Property Development', 'Green Bonds'],
    readTime: '7 min read',
    publishDate: '2025-02-01',
  },
};
