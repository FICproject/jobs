import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchItTrainingProcesses } from '../../services/jobService';
import { ApplyModal } from '../../components/ApplyModal';

const FALLBACK_IT_PROCESSES = [
  // PLACEMENT PROCESSES
  {
    id: 'it_proc_1',
    processName: 'PROCESS 1',
    itCategory: 'Placement',
    programTitle: 'FIC IT Training & 100% Placement Programme',
    role: 'Software Engineer Trainee',
    salary: '3.5 - 4.5 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Classroom Training | 3 Months Real Project Training',
    stipend: '12,000',
    stipendSubtext: 'Stipend ₹12,000 per month during training',
    trainingFee: '1.6 LPA',
    bondPeriod: '1 Year Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Comprehensive software development track covering Full Stack technologies, live customer projects, and guaranteed placement.',
    status: 'Active'
  },
  {
    id: 'it_proc_2',
    processName: 'PROCESS 2',
    itCategory: 'Placement',
    programTitle: 'FIC IT Training & Placement - Advanced Track',
    role: 'Software Developer Trainee',
    salary: '4.5 - 6.0 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Classroom Training | 3 Months Enterprise Project OJT',
    stipend: '12,000',
    stipendSubtext: 'Stipend ₹12,000 per month during training',
    trainingFee: '2.0 LPA',
    bondPeriod: '2 Years Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Advanced engineering track focusing on Cloud, Full Stack, and Enterprise solutions with high-tier placement.',
    status: 'Active'
  },
  {
    id: 'it_proc_3',
    processName: 'PROCESS 1',
    itCategory: 'Placement',
    programTitle: 'FIC IT Full Stack Development Track',
    role: 'Full Stack Developer',
    salary: '4.5 - 6.5 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Frontend & Backend Training | 3 Months Enterprise Live Projects',
    stipend: '12,000',
    stipendSubtext: 'Stipend ₹12,000 per month during training',
    trainingFee: '1.6 LPA',
    bondPeriod: '1 Year Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Full Stack engineering program covering React, Node.js, databases, microservices and enterprise application development.',
    status: 'Active'
  },
  {
    id: 'it_proc_4',
    processName: 'PROCESS 2',
    itCategory: 'Placement',
    programTitle: 'FIC IT Full Stack Advanced Placement',
    role: 'Full Stack Developer',
    salary: '5.5 - 7.5 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Cloud & Architecture Specialization | 3 Months Client Deployment',
    stipend: '15,000',
    stipendSubtext: 'Stipend ₹15,000 per month during training',
    trainingFee: '2.0 LPA',
    bondPeriod: '2 Years Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Specialized enterprise full stack track with cloud architecture, DevOps, and tier-1 product firm placement.',
    status: 'Active'
  },
  {
    id: 'it_proc_fs_3',
    processName: 'PROCESS 3',
    itCategory: 'Placement',
    programTitle: 'FIC IT Full Stack - Global Placement & Cloud Track',
    role: 'Full Stack Developer',
    salary: '6.5 - 9.0 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Advanced Architecture & Microservices | 3 Months US/Client Live Production OJT',
    stipend: '18,000',
    stipendSubtext: 'Stipend ₹18,000 per month during training',
    trainingFee: '2.4 LPA (100% Placement Guarantee)',
    bondPeriod: '2 Years Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Elite Full Stack engineering track specializing in Distributed Cloud Architecture, DevOps, and tier-1 product firm placement.',
    status: 'Active'
  },
  {
    id: 'it_proc_7',
    processName: 'PROCESS 1',
    itCategory: 'Placement',
    programTitle: 'FIC IT Java Enterprise Training Track',
    role: 'Java Developer',
    salary: '4.2 - 6.2 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Core & Advanced Java, Spring Boot | 3 Months Enterprise Banking Project',
    stipend: '12,000',
    stipendSubtext: 'Stipend ₹12,000 per month during training',
    trainingFee: '1.6 LPA',
    bondPeriod: '1 Year Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Enterprise backend development with Java, Spring Boot, Hibernate, microservices architecture, and SQL.',
    status: 'Active'
  },
  {
    id: 'it_proc_8',
    processName: 'PROCESS 2',
    itCategory: 'Placement',
    programTitle: 'FIC IT Java Microservices & Cloud Track',
    role: 'Java Developer',
    salary: '5.2 - 7.2 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Spring Cloud, Kafka, Docker & Kubernetes | 3 Months Production FinTech App',
    stipend: '15,000',
    stipendSubtext: 'Stipend ₹15,000 per month during training',
    trainingFee: '2.0 LPA',
    bondPeriod: '2 Years Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'High-scale distributed systems in Java with Spring Cloud, Kafka event streams, and cloud-native Kubernetes deployment.',
    status: 'Active'
  },
  {
    id: 'it_proc_9',
    processName: 'PROCESS 1',
    itCategory: 'Placement',
    programTitle: 'FIC IT Python & Backend Development Track',
    role: 'Python Developer',
    salary: '4.0 - 6.0 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Python, Django & FastAPI | 3 Months Live Data & Web Services Project',
    stipend: '12,000',
    stipendSubtext: 'Stipend ₹12,000 per month during training',
    trainingFee: '1.6 LPA',
    bondPeriod: '1 Year Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Robust Python backend development with Django, FastAPI, PostgreSQL, asynchronous workflows, and API design.',
    status: 'Active'
  },
  {
    id: 'it_proc_10',
    processName: 'PROCESS 2',
    itCategory: 'Placement',
    programTitle: 'FIC IT Python Data & AI/ML Engineering Track',
    role: 'Python Developer',
    salary: '5.0 - 7.0 LPA',
    location: 'PAN INDIA / Chennai / Bangalore',
    trainingPeriod: '6 Months',
    trainingSubtext: '3 Months Advanced Python, Pandas, Machine Learning & Cloud APIs | 3 Months Industry ML Pipeline',
    stipend: '14,000',
    stipendSubtext: 'Stipend ₹14,000 per month during training',
    trainingFee: '1.9 LPA',
    bondPeriod: '2 Years Bond',
    originalsRequired: 'Originals Need to Submit',
    description: 'Data-intensive Python development with automated data pipelines, ML model deployment, and cloud integration.',
    status: 'Active'
  },

  // INTERNSHIP PROCESSES
  {
    id: 'it_proc_intern_1',
    processName: 'PROCESS 1',
    itCategory: 'Internship',
    programTitle: 'FIC Free Full Stack Internship Program',
    role: 'Full Stack Developer',
    salary: 'Stipend: ₹0',
    location: 'PAN INDIA / Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Live Enterprise Projects & Code Reviews',
    stipend: '0',
    stipendSubtext: '100% Free Internship - Zero Cost',
    trainingFee: '100% FREE',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Work on live production web apps using React, Node.js, and databases alongside experienced software leads. Build real portfolio projects without paying any fees.',
    status: 'Active'
  },
  {
    id: 'it_proc_intern_2',
    processName: 'PROCESS 1',
    itCategory: 'Internship',
    programTitle: 'FIC Free Python & AI Engineering Internship',
    role: 'Python Developer',
    salary: 'Stipend: ₹0',
    location: 'PAN INDIA / Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Hands-on Data & Web Pipeline Development',
    stipend: '0',
    stipendSubtext: '100% Free Internship - Zero Cost',
    trainingFee: '100% FREE',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Hands-on live project internship in Python, Django/FastAPI, API integrations, and machine learning pipelines under industry mentorship.',
    status: 'Active'
  },
  {
    id: 'it_proc_intern_3',
    processName: 'PROCESS 1',
    itCategory: 'Internship',
    programTitle: 'FIC Free Java Enterprise Development Internship',
    role: 'Java Developer',
    salary: 'Stipend: ₹0',
    location: 'PAN INDIA / Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Real Industry Backend Services Project',
    stipend: '0',
    stipendSubtext: '100% Free Internship - Zero Cost',
    trainingFee: '100% FREE',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Real industry experience building Java, Spring Boot microservices, REST APIs, and database transactions in commercial projects.',
    status: 'Active'
  },
  {
    id: 'it_proc_intern_4',
    processName: 'PROCESS 1',
    itCategory: 'Internship',
    programTitle: 'FIC Free Software Engineer Internship',
    role: 'Software Engineer Trainee',
    salary: 'Stipend: ₹0',
    location: 'PAN INDIA / Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Full Software Development Lifecycle',
    stipend: '0',
    stipendSubtext: '100% Free Internship - Zero Cost',
    trainingFee: '100% FREE',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Join our exclusive 100% Free Internship program. Work on live industry projects alongside experienced developers without paying any fees.',
    status: 'Active'
  },

  // COURSE PROCESSES
  {
    id: 'it_proc_course_1',
    processName: 'PROCESS 1',
    itCategory: 'Course',
    programTitle: 'FIC Full Stack Web Development Master Course',
    role: 'Full Stack Developer',
    salary: 'Career Support & Certificate',
    location: 'Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Modern MERN / Full Stack Curriculum',
    stipend: '0',
    stipendSubtext: 'Practical Training & Project Portfolio',
    trainingFee: '₹15,000 (One-time payment)',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Master HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, and Git. Build 5+ portfolio projects with code reviews and certificate.',
    status: 'Active'
  },
  {
    id: 'it_proc_course_2',
    processName: 'PROCESS 1',
    itCategory: 'Course',
    programTitle: 'FIC Python & AI/ML Certification Course',
    role: 'Python Developer',
    salary: 'Career Support & Certificate',
    location: 'Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Python, Data Science & ML Projects',
    stipend: '0',
    stipendSubtext: 'Practical Training & Project Portfolio',
    trainingFee: '₹15,000 (One-time payment)',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Comprehensive Python training covering programming fundamentals, Pandas, NumPy, Scikit-Learn, data visualization, and AI APIs.',
    status: 'Active'
  },
  {
    id: 'it_proc_course_3',
    processName: 'PROCESS 1',
    itCategory: 'Course',
    programTitle: 'FIC Java Enterprise & Microservices Course',
    role: 'Java Developer',
    salary: 'Career Support & Certificate',
    location: 'Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Core Java, Spring Boot & Cloud',
    stipend: '0',
    stipendSubtext: 'Practical Training & Project Portfolio',
    trainingFee: '₹15,000 (One-time payment)',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Learn Core Java, OOP principles, Spring Boot framework, RESTful web services, Hibernate/JPA, and microservices architecture.',
    status: 'Active'
  },
  {
    id: 'it_proc_course_4',
    processName: 'PROCESS 1',
    itCategory: 'Course',
    programTitle: 'FIC Software Engineering Foundation Course',
    role: 'Software Engineer Trainee',
    salary: 'Career Support & Certificate',
    location: 'Online',
    trainingPeriod: '3 Months',
    trainingSubtext: '3 Months Data Structures, Algorithms & Web Systems',
    stipend: '0',
    stipendSubtext: 'Practical Training & Project Portfolio',
    trainingFee: '₹15,000 (One-time payment)',
    bondPeriod: 'No Bond',
    originalsRequired: 'Not Required',
    description: 'Enroll in our comprehensive IT training courses designed for beginners to advanced professionals. Build real-world projects and accelerate your career.',
    status: 'Active'
  }
];

const RollingMarquee = ({ items, renderItem, speed = 35 }) => {
  const [contentWidth, setContentWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (contentWidth <= 0) return;
    scrollX.setValue(0);
    const duration = (contentWidth * 1000) / speed;
    const anim = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [contentWidth, speed]);

  const displayItems =
    items.length > 0 && items.length < 5
      ? [...items, ...items, ...items, ...items]
      : items;

  return (
    <View style={styles.marqueeContainer}>
      <Animated.View
        style={[
          styles.marqueeTrack,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        <View
          style={styles.marqueeRow}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - contentWidth) > 1) {
              setContentWidth(w);
            }
          }}
        >
          {displayItems.map((item, idx) => renderItem(item, idx, 'a'))}
        </View>
        <View style={styles.marqueeRow}>
          {displayItems.map((item, idx) => renderItem(item, idx, 'b'))}
        </View>
      </Animated.View>
    </View>
  );
};

export const ItTrainingScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { category = 'Placement' } = route.params || {};

  const [itProcesses, setItProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchItTrainingProcesses().then((data) => {
      if (isMounted) {
        const fetchedList = Array.isArray(data) ? data : [];
        // Ensure category items are present; if empty for this category, supplement with fallback
        const hasCategoryItems = fetchedList.some(
          (p) => (p.itCategory || 'Placement') === category
        );
        if (hasCategoryItems) {
          setItProcesses(fetchedList);
        } else {
          // Merge fetched with fallback for missing category
          const fallbackForCat = FALLBACK_IT_PROCESSES.filter(
            (p) => (p.itCategory || 'Placement') === category
          );
          setItProcesses([...fetchedList, ...fallbackForCat]);
        }
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [category]);

  // Filter processes by selected IT category ('Placement', 'Course', 'Internship')
  const rawFiltered = itProcesses.filter(
    (proc) => (proc.itCategory || 'Placement') === category
  );

  const filteredProcesses =
    rawFiltered.length > 0
      ? rawFiltered
      : FALLBACK_IT_PROCESSES.filter(
          (proc) => (proc.itCategory || 'Placement') === category
        );

  // Group roles as done in candidate web view
  const getGroupedItRoles = () => {
    const groups = [];
    filteredProcesses.forEach((proc) => {
      const rawRole = (proc.role || 'Software Developer Trainee').trim();
      const normKey =
        rawRole
          .toLowerCase()
          .replace(/\btrainee\b/gi, '')
          .replace(/\bengineer\b/gi, 'developer')
          .replace(/[^a-z0-9]/g, '')
          .trim() || 'softwaredeveloper';

      let group = groups.find((g) => g.normKey === normKey);
      if (!group) {
        group = {
          role: rawRole,
          normKey: normKey,
          processes: [],
          primaryProcess: proc,
        };
        groups.push(group);
      }
      group.processes.push(proc);
    });
    return groups;
  };

  const convertItProcToJob = (proc, processList = null) => {
    const isCourse = category === 'Course';
    const isInternship = category === 'Internship';
    const compName = isCourse
      ? 'FIC IT Courses'
      : isInternship
      ? 'FIC Free IT Internship'
      : 'FIC IT Training & Placement';

    const bondText = (() => {
      if (isCourse || isInternship) return '';
      const list = processList || [proc];
      const seen = new Set();
      const unique = list
        .map((p) => p.bondPeriod)
        .filter(Boolean)
        .filter((v) => {
          const key = v.toLowerCase().replace(/\s+/g, '');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      return unique.length > 0 ? unique[0] : proc.bondPeriod || '1 Year Bond';
    })();

    const feeText = (() => {
      if (isInternship) return '100% FREE';
      const list = processList || [proc];
      return (
        list
          .map((p) => p.trainingFee)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(' - ') || proc.trainingFee || '1.6 LPA'
      );
    })();

    return {
      id: proc.id,
      title: proc.role || 'Software Engineer Trainee',
      role: proc.role || 'Software Engineer Trainee',
      company: compName,
      companyName: compName,
      companyLogo: '/logo.png',
      categoryName: 'IT & Software Development',
      categoryId: 'cat_it',
      itCategory: proc.itCategory || category,
      processName: proc.processName || 'PROCESS 1',
      programName: `${proc.processName || 'PROCESS 1'}: ${
        proc.programTitle || 'FIC IT Training Program'
      }`,
      programTitle: proc.programTitle,
      salary:
        proc.salary ||
        (isInternship
          ? 'Stipend: ₹0'
          : isCourse
          ? 'Career Support & Certificate'
          : '3.5 - 6.0 LPA'),
      experience: 'Fresher & Experience',
      experienceTag: 'Fresher & Experience',
      location: proc.location || (isCourse ? 'Online' : 'PAN INDIA'),
      trainingPeriod: proc.trainingPeriod || '6 Months',
      trainingTitle: proc.trainingPeriod || '6 Months',
      trainingSubtext:
        proc.trainingSubtext ||
        (isCourse
          ? '3 Months Hands-on Curriculum & Portfolio Projects'
          : isInternship
          ? '3 Months Live Enterprise Projects'
          : '3 Months Classroom Training | 3 Months Real Project Training'),
      stipend: `STIPEND ₹${proc.stipend || (isInternship ? '0' : '12,000')}`,
      stipendTitle: `STIPEND ₹${proc.stipend || (isInternship ? '0' : '12,000')}`,
      stipendSubtext:
        proc.stipendSubtext ||
        (isInternship
          ? '100% Free Internship - Zero Cost'
          : `Stipend ₹${proc.stipend || '12,000'} per month during training`),
      trainingFee: feeText,
      feeRefundType: isCourse
        ? 'Course Fee'
        : isInternship
        ? '100% Free'
        : '100% Placement Guarantee',
      feeRefundDetails: isInternship
        ? 'Zero Cost Internship'
        : '100% money back guarantee upon successful training completion',
      bondPeriod: bondText,
      originalsRequired:
        proc.originalsRequired ||
        (isCourse || isInternship ? 'Not Required' : 'Originals Need to Submit'),
      description:
        proc.description ||
        (isCourse
          ? `Enroll in our comprehensive IT training courses designed for beginners to advanced professionals. Build real-world projects and accelerate your career.`
          : isInternship
          ? `Join our exclusive 100% Free Internship program. Work on live industry projects alongside experienced developers without paying any fees.`
          : `ROLE: ${proc.role} | Location: ${proc.location || 'PAN INDIA'} | Stipend: ₹${
              proc.stipend || '12,000'
            } | Program Fees: ${feeText} | ${
              proc.originalsRequired || 'Originals Need to Submit'
            }.`),
      responsibilities: isCourse
        ? [
            'Master core concepts, modern frameworks, and design patterns.',
            'Build full stack portfolio applications with industry best practices.',
            'Participate in live coding sessions, problem solving, and architecture reviews.',
            'Complete milestone capstone projects with code walkthroughs.',
          ]
        : isInternship
        ? [
            'Work on live enterprise and customer projects under guidance of senior technical leads.',
            'Collaborate with development teams in daily standups, code reviews, and sprints.',
            'Build real-world features, write clean maintainable code, and fix defects.',
            'Gain hands-on software development lifecycle (SDLC) experience.',
          ]
        : [
            'Complete comprehensive software development and full stack curriculum.',
            'Work on live enterprise projects under guidance of senior technical leads.',
            'Participate in mock technical interviews, system design sessions, and client presentations.',
            'Clear evaluation rounds and get deployed to hiring partner tech firms.',
          ],
      requirements:
        isCourse || isInternship
          ? [
              'Any Degree (B.E, B.Tech, B.Sc, BCA, MCA, M.Tech) with interest in IT careers.',
              'Basic logical thinking, computer fundamentals, and readiness to learn.',
            ]
          : [
              'Any Degree (B.E, B.Tech, B.Sc, BCA, MCA, M.Tech) with interest in IT careers.',
              'Basic logical thinking, computer fundamentals, and readiness to learn.',
              `Agreement to program terms: ${bondText || '1 Year Bond'}.`,
              `${
                proc.originalsRequired || 'Originals Need to Submit'
              } for document verification.`,
            ],
      interviewSteps:
        proc.selectionSteps && proc.selectionSteps.length > 0
          ? proc.selectionSteps
          : [
              {
                stepNumber: 1,
                title: 'Screening & Registration',
                description: 'Application review and initial profile shortlisting',
              },
              {
                stepNumber: 2,
                title: 'Technical Assessment',
                description: 'Basic coding, problem solving and aptitude round',
              },
              {
                stepNumber: 3,
                title: 'Technical & HR Interview',
                description: 'Discussion with hiring manager & interview clearance',
              },
              {
                stepNumber: 4,
                title: 'Batch Onboarding',
                description: 'Offer letter issuance, document submission, and training commencement',
              },
            ],
      trainingPhases:
        proc.trainingPhases && proc.trainingPhases.length > 0
          ? proc.trainingPhases
          : proc.trainingSubtext && proc.trainingSubtext.includes('|')
          ? [
              {
                title: 'Phase 1 Training',
                duration: proc.trainingSubtext.split('|')[0].trim(),
                mode: 'Classroom Training',
                stipend: `STIPEND ₹${proc.stipend || '12,000'}`,
              },
              {
                title: 'Phase 2 Training',
                duration: proc.trainingSubtext.split('|')[1].trim(),
                mode: 'Real Project Training (OJT)',
                stipend: `STIPEND ₹${proc.stipend || '12,000'}`,
              },
            ]
          : [
              {
                title: 'Phase 1 Training',
                duration: proc.trainingPeriod || '3 Months',
                mode: 'Classroom Training',
                stipend: `STIPEND ₹${proc.stipend || '12,000'}`,
              },
              {
                title: 'Phase 2 Training',
                duration: '3 Months',
                mode: 'Real Project Training (OJT)',
                stipend: `STIPEND ₹${proc.stipend || '12,000'}`,
              },
            ],
      itProcessList: processList && processList.length > 0 ? processList : [proc],
    };
  };

  const groupedRoles = getGroupedItRoles();

  const titleText =
    category === 'Placement'
      ? 'Openings at FIC IT Training & Placement'
      : category === 'Course'
      ? 'FIC IT Training Courses'
      : 'FIC Free IT Internship';

  const subtitleText =
    category === 'Placement'
      ? `Showing ${groupedRoles.length} career training role${
          groupedRoles.length !== 1 ? 's' : ''
        } with 100% placement guarantee`
      : `Showing ${groupedRoles.length} career training role${
          groupedRoles.length !== 1 ? 's' : ''
        }`;

  const applyBtnLabel =
    category === 'Course'
      ? 'Enroll Now'
      : category === 'Internship'
      ? 'Apply for Internship'
      : 'Apply Now';

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" translucent />

      {/* Top Portal Header Bar */}
      <View
        style={[
          styles.topHeaderBar,
          { paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0, 36) + 8 },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitleFIC}>FIC </Text>
              <Text style={styles.brandTitleRecruit}>RecruitPro</Text>
            </View>
            <Text style={styles.brandSubtitle}>Candidate Portal</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Auto-Rolling Marquee Ticker Banner (Full-Width) */}
      {groupedRoles.length > 0 && (
        <View style={styles.tickerBar}>
          <RollingMarquee
            items={groupedRoles}
            speed={35}
            renderItem={(g, idx, prefix) => {
              const colors = ['#064E3B', '#1E3A8A', '#4C1D95', '#78350F', '#831843', '#0F766E'];
              const tagColors = ['#6EE7B7', '#93C5FD', '#DDD6FE', '#FDE68A', '#FBCFE8', '#99F6E4'];
              const bgCol = colors[idx % colors.length];
              const textCol = tagColors[idx % tagColors.length];
              return (
                <View
                  key={`${prefix}-${g.normKey}-${idx}`}
                  style={[styles.tickerPill, { backgroundColor: bgCol }]}
                >
                  <Text style={styles.tickerPillTextWhite}>
                    {g.role}{' '}
                    <Text style={{ color: textCol, fontWeight: '800' }}>
                      • {g.processes.length} Active {g.processes.length === 1 ? 'Track' : 'Tracks'}
                    </Text>
                  </Text>
                </View>
              );
            }}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading IT openings...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainContent}>
          {/* Section Heading */}
          <View style={styles.pageHeader}>
            <Text style={styles.mainHeading}>{titleText}</Text>
            <Text style={styles.subHeading}>{subtitleText}</Text>
          </View>

          {groupedRoles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No openings currently listed for this program.</Text>
            </View>
          ) : (
            groupedRoles.map((group) => {
              const primaryProc = group.primaryProcess || group.processes[0];
              const jobObj = convertItProcToJob(primaryProc, group.processes);

              return (
                <TouchableOpacity
                  key={group.normKey}
                  style={styles.cardContainer}
                  activeOpacity={0.92}
                  onPress={() =>
                    navigation.navigate('JobDetails', {
                      jobId: primaryProc.id,
                      job: jobObj,
                      itProcesses: group.processes,
                      category: category,
                    })
                  }
                >
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardLogoCircle}>
                      <Image
                        source={require('../../assets/images/logo.jpg')}
                        style={styles.cardLogoImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.cardHeaderTitleCol}>
                      <Text style={styles.cardRoleTitle}>{group.role}</Text>
                      <Text style={styles.cardCompanySub}>{jobObj.company}</Text>
                    </View>
                  </View>

                  {/* Chips Row Matching Website */}
                  <View style={styles.chipsRow}>
                    <View style={[styles.chipPill, styles.chipExp]}>
                      <Text style={styles.chipExpText}>🧳 Fresher & Experience</Text>
                    </View>

                    {category === 'Placement' && (
                      <View style={[styles.chipPill, styles.chipSalary]}>
                        <Text style={styles.chipSalaryText}>
                          💰 {primaryProc.salary || '3.5 - 6.0 LPA'}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.chipPill, styles.chipTraining]}>
                      <Text style={styles.chipTrainingText}>
                        🎓 Training: {primaryProc.trainingPeriod || '6 Months'}
                      </Text>
                    </View>

                    {category === 'Placement' && jobObj.bondPeriod && (
                      <View style={[styles.chipPill, styles.chipBond]}>
                        <Text style={styles.chipBondText}>📜 {jobObj.bondPeriod}</Text>
                      </View>
                    )}

                    {category === 'Placement' && primaryProc.location && (
                      <View style={[styles.chipPill, styles.chipLocation]}>
                        <Text style={styles.chipLocationText}>📍 {primaryProc.location}</Text>
                      </View>
                    )}
                  </View>

                  {/* Snippet Description */}
                  <Text style={styles.snippetText}>{jobObj.description}</Text>

                  {/* Card Action Buttons */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() =>
                        navigation.navigate('JobDetails', {
                          jobId: primaryProc.id,
                          job: jobObj,
                          itProcesses: group.processes,
                          category: category,
                        })
                      }
                    >
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.applyNowBtn}
                      onPress={() => {
                        navigation.navigate('Apply', { job: jobObj });
                      }}
                    >
                      <Text style={styles.applyNowText}>{applyBtnLabel}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Application Modal Popup */}
      <ApplyModal
        visible={applyModalVisible}
        onClose={() => setApplyModalVisible(false)}
        job={selectedJobForModal}
        onSuccess={(applicationId) => {
          navigation.navigate('ApplicationSuccess', {
            jobTitle: selectedJobForModal?.title || 'IT Training Program',
            company: selectedJobForModal?.company || 'FIC RecruitPro',
            applicationId: applicationId || `FIC-${Date.now().toString().slice(-6)}`,
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  topHeaderBar: {
    backgroundColor: '#0A1128',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFIC: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitleRecruit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  brandSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  browseBannerRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  backToBrowseBtn: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  backToBrowseText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 13,
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
  },
  marqueeTrack: {
    flexDirection: 'row',
  },
  marqueeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerBar: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  tickerPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 10,
  },
  tickerPillTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  mainContent: {
    paddingTop: 4,
  },
  pageHeader: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoImage: {
    width: '100%',
    height: '100%',
  },
  cardHeaderTitleCol: {
    flex: 1,
  },
  cardRoleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardCompanySub: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  chipPill: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  chipExp: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  chipExpText: {
    color: '#7E22CE',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipSalary: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  chipSalaryText: {
    color: '#047857',
    fontSize: 11.5,
    fontWeight: '800',
  },
  chipTraining: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chipTrainingText: {
    color: '#92400E',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipBond: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chipBondText: {
    color: '#B45309',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipLocation: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipLocationText: {
    color: '#1D4ED8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  snippetText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 16,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  viewDetailsText: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  applyNowBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  applyNowText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
