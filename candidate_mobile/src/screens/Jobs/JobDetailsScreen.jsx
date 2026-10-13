import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchJobById } from '../../services/jobService';
import { ApplyModal } from '../../components/ApplyModal';

const BANK_LOGOS = {
  axis: require('../../assets/images/logos/axis_bank.png'),
  idfc: require('../../assets/images/logos/idfc_first_bank.png'),
  kotak: require('../../assets/images/logos/kotak_bank.png'),
  bandhan: require('../../assets/images/logos/bandhan_bank.png'),
  aditya: require('../../assets/images/logos/aditya_birla.jpg'),
  birla: require('../../assets/images/logos/aditya_birla.jpg'),
  'mahindra finance': require('../../assets/images/logos/mahindra_finance.png'),
  yes: require('../../assets/images/logos/Yes_Bank_Logo.jpg'),
  hdfc: require('../../assets/images/logos/Hdfc.jpg'),
  tata: require('../../assets/images/logos/tata_aig.png'),
};

const getCompanyLogo = (compName, compLogo) => {
  const lower = (compName || '').toLowerCase();
  for (const key of Object.keys(BANK_LOGOS)) {
    if (lower.includes(key)) return BANK_LOGOS[key];
  }
  if (compLogo && typeof compLogo === 'string' && compLogo.startsWith('http')) {
    return { uri: compLogo };
  }
  return require('../../assets/images/logo.jpg');
};

const getTrainingPhasesList = (targetJob) => {
  if (!targetJob) return [];
  if (targetJob.trainingPhases && Array.isArray(targetJob.trainingPhases) && targetJob.trainingPhases.length > 0) {
    return targetJob.trainingPhases;
  }
  if (targetJob.trainingPeriod && typeof targetJob.trainingPeriod === 'string') {
    const parts = targetJob.trainingPeriod.split('|');
    const parsed = parts.map((part) => {
      const text = part.trim();
      let duration = text;
      let mode = '';
      let stipend = '';

      const cleanText = text.replace(/^Phase\s*\d+\s*:\s*/i, '');
      const dashSplit = cleanText.split('-');
      if (dashSplit.length > 1) {
        stipend = dashSplit.slice(1).join('-').trim();
        duration = dashSplit[0].trim();
      } else {
        duration = cleanText;
      }

      const parenMatch = duration.match(/\((.*?)\)/);
      if (parenMatch) {
        mode = parenMatch[1];
        duration = duration.replace(/\((.*?)\)/, '').trim();
      }

      return {
        duration,
        mode: mode || 'Classroom Training',
        stipend: stipend || targetJob.stipend || 'Stipend Provided',
      };
    });
    if (parsed.length > 0) return parsed;
  }
  return [];
};

export const JobDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const { jobId, job: routeJob, itProcesses: routeProcesses, category: routeCategory } =
    route.params || {};

  const [job, setJob] = useState(routeJob || null);
  const [loading, setLoading] = useState(!routeJob);
  const [showAfterSelection, setShowAfterSelection] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState(routeJob?.id || null);

  useEffect(() => {
    let isMounted = true;
    if (!routeJob && jobId) {
      setLoading(true);
      fetchJobById(jobId).then((data) => {
        if (isMounted) {
          if (data && !data.error) {
            setJob(data);
            setSelectedProcessId(data.id);
          }
          setLoading(false);
        }
      });
    } else if (routeJob) {
      setJob(routeJob);
      setSelectedProcessId(routeJob.id);
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [jobId, routeJob]);

  if (loading) {
    return (
      <View style={[styles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Loading details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.screenContainer, styles.center]}>
        <Text style={styles.notFoundText}>Job details not found.</Text>
        <TouchableOpacity
          style={{ marginTop: 16, backgroundColor: '#0284C7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Detect whether this is an IT Training Program (FIC IT)
  const isItJob =
    job?.categoryId === 'cat_it' ||
    (job?.categoryName && job.categoryName.toLowerCase().includes('it')) ||
    (job?.companyName &&
      (job.companyName.includes('FIC IT') ||
        job.companyName.includes('Free IT Internship') ||
        job.companyName.includes('IT Training') ||
        job.companyName.includes('IT Courses'))) ||
    job?.itCategory !== undefined ||
    (job?.id && String(job.id).startsWith('it_proc'));

  const itCategory = job?.itCategory || routeCategory || 'Placement';
  const isCourse = itCategory === 'Course';
  const isInternship = itCategory === 'Internship';
  const isPlacement = itCategory === 'Placement';

  // Process list for process switcher
  const processList =
    routeProcesses && routeProcesses.length > 0
      ? routeProcesses
      : job?.itProcessList && job.itProcessList.length > 0
      ? job.itProcessList
      : [job];

  const currentProcess =
    processList.find((p) => p.id === selectedProcessId) || processList[0] || job;

  // Sync displayed fields with current active process
  const activeTitle = currentProcess.role || currentProcess.title || job.title || 'Software Engineer Trainee';
  const activeCompany =
    currentProcess.companyName ||
    job.companyName ||
    (isCourse
      ? 'FIC IT Courses'
      : isInternship
      ? 'FIC Free IT Internship'
      : 'FIC IT Training & Placement');
  const activeProgramName =
    currentProcess.programName ||
    (currentProcess.processName
      ? `${currentProcess.processName}: ${currentProcess.programTitle || 'FIC IT Training Program'}`
      : job.programName);

  const trainingPhasesList =
    currentProcess.trainingPhases && currentProcess.trainingPhases.length > 0
      ? currentProcess.trainingPhases
      : getTrainingPhasesList(currentProcess.trainingPeriod ? currentProcess : job);

  const activeSalary = currentProcess.salary || job.salary || (isInternship ? 'Stipend: ₹0' : '3.5 - 6.0 LPA');
  const salarySubtextLines = (currentProcess.salarySubtext || job.salarySubtext)
    ? (currentProcess.salarySubtext || job.salarySubtext).split('|').map((s) => s.trim()).filter(Boolean)
    : ['Fixed CTC per Annum', 'Incentives over and above'];

  const activeLocation = (currentProcess.location || job.location || (isCourse ? 'ONLINE' : 'PAN INDIA')).toUpperCase();
  let locationSubtextLines = [];
  if (isItJob) {
    if (isCourse) locationSubtextLines = ['Course Location: Online'];
    else if (isInternship) locationSubtextLines = ['Internship Location: Online'];
    else locationSubtextLines = ['Job Location', 'Placement Location as per track'];
  } else {
    const locSub = currentProcess.locationSubtext || job.locationSubtext;
    if (locSub) {
      locationSubtextLines = locSub.split('|').map((s) => s.trim()).filter(Boolean);
    } else {
      locationSubtextLines = ['Job Location', 'Based on Aadhar card or your nearby'];
    }
  }

  const activeTrainingPeriod =
    currentProcess.trainingTitle ||
    job.trainingTitle ||
    (trainingPhasesList.length > 0
      ? trainingPhasesList.map((t) => t.duration).filter(Boolean).join(' + ')
      : (currentProcess.trainingPeriod || job.trainingPeriod || 'Structured Period'));

  const trainingSubtextLines = (currentProcess.trainingSubtext || job.trainingSubtext)
    ? (currentProcess.trainingSubtext || job.trainingSubtext).split('|').map((s) => s.trim()).filter(Boolean)
    : ['Campus Training & Internship OJT'];

  const activeStipend = (
    currentProcess.stipendTitle ||
    job.stipendTitle ||
    (trainingPhasesList.length > 0 && trainingPhasesList[0].stipend
      ? trainingPhasesList[0].stipend
      : (currentProcess.stipend ? `STIPEND ₹${currentProcess.stipend}` : job.stipend || 'STIPEND PROVIDED'))
  ).toUpperCase();

  const stipendSubtextLines = (currentProcess.stipendSubtext || job.stipendSubtext)
    ? (currentProcess.stipendSubtext || job.stipendSubtext).split('|').map((s) => s.trim()).filter(Boolean)
    : (isInternship
        ? ['100% Free Internship - Zero Cost']
        : ['Stipend during training', 'Regular salary post-training']);

  const activeFee =
    currentProcess.trainingFee ||
    job.trainingFee ||
    currentProcess.interviewCrackFee ||
    job.interviewCrackFee ||
    (isInternship ? '100% FREE' : isCourse ? '₹15,000 (One-time payment)' : '100% FREE');

  const activeRefundType = currentProcess.feeRefundType || job.feeRefundType;
  const feeSubtext = isCourse
    ? 'Course Fees (One-time payment)'
    : `Program Fees (${activeRefundType ? activeRefundType : '*Terms & Guidelines apply'})`;

  // Crucial: Only present if DB has a non-empty string! NO fake fallback!
  const activeBond = (currentProcess.bondPeriod || job.bondPeriod || '').trim();
  const activeOriginals = (currentProcess.originalsRequired || job.originalsRequired || '').trim();

  const activeDesc =
    currentProcess.description ||
    job.description ||
    (isCourse
      ? 'Enroll in our comprehensive IT training courses designed for beginners to advanced professionals. Build real-world projects and accelerate your career.'
      : isInternship
      ? 'Join our exclusive 100% Free Internship program. Work on live industry projects alongside experienced developers without paying any fees.'
      : 'Complete IT Job Training with 100% placement guarantee in top IT companies. View multiple training processes, monthly stipend, bond terms, and selection roadmap.');

  const responsibilitiesList =
    currentProcess.responsibilities ||
    job.responsibilities ||
    (isCourse
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
        ]);

  const requirementsList =
    currentProcess.requirements ||
    job.requirements ||
    (isCourse || isInternship
      ? [
          'Any Degree (B.E, B.Tech, B.Sc, BCA, MCA, M.Tech) with interest in IT careers.',
          'Basic logical thinking, computer fundamentals, and readiness to learn.',
        ]
      : [
          'Any Degree (B.E, B.Tech, B.Sc, BCA, MCA, M.Tech) with interest in IT careers.',
          'Basic logical thinking, computer fundamentals, and readiness to learn.',
        ]);

  const interviewRounds =
    currentProcess.selectionSteps ||
    currentProcess.interviewSteps ||
    job.interviewSteps || [
      { stepNumber: 1, title: 'Screening & Registration', description: 'Application review and initial profile shortlisting' },
      { stepNumber: 2, title: 'Technical Assessment', description: 'Basic coding, problem solving and aptitude round' },
      { stepNumber: 3, title: 'Technical & HR Interview', description: 'Discussion with hiring manager & interview clearance' },
      { stepNumber: 4, title: 'Batch Onboarding', description: 'Offer letter issuance, document submission, and training commencement' },
    ];

  const applyButtonLabel = isCourse
    ? '📖 Enroll Now'
    : isInternship
    ? '🚀 Apply for Internship'
    : '🚀 Apply Now';

  const sectionRespTitle = isCourse
    ? "Course Curriculum & What You'll Learn"
    : isInternship
    ? 'Internship Responsibilities'
    : 'Roles & Responsibilities';

  const sectionOverviewTitle = isCourse
    ? 'Program Overview'
    : isInternship
    ? 'Internship Overview'
    : 'Job Overview';

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

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Title Header Card */}
        <View style={styles.jobTitleCard}>
          <View style={styles.headerLogoBadge}>
            <Image
              source={getCompanyLogo(activeCompany, currentProcess.companyLogo || job.companyLogo)}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTitleColumn}>
            <Text style={styles.jobTitleMain}>{activeTitle}</Text>
            <Text style={styles.jobCompanySub}>
              {activeCompany} •{' '}
              <Text style={{ color: '#2563EB', fontWeight: '700' }}>
                {job.categoryName || (isItJob ? 'IT & Software Development' : 'Banking & Financial Services')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Process Switcher Tabs (Only for Placement when multiple processes exist) */}
        {isItJob && isPlacement && processList.length > 1 && (
          <View style={styles.processSwitcherContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {processList.map((proc, idx) => {
                const isSelected = (currentProcess.id === proc.id) || (proc.processName === currentProcess.processName);
                return (
                  <TouchableOpacity
                    key={proc.id || idx}
                    style={[
                      styles.processTabBtn,
                      isSelected && styles.processTabBtnActive,
                    ]}
                    onPress={() => setSelectedProcessId(proc.id)}
                  >
                    <Text
                      style={[
                        styles.processTabText,
                        isSelected && styles.processTabTextActive,
                      ]}
                    >
                      {proc.processName || `PROCESS ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Infographic Poster Card (Matching Website Infographic Grid) */}
        <View style={styles.programCard}>
          {activeProgramName ? (
            <Text style={styles.programTitle}>{activeProgramName}</Text>
          ) : null}

          <View style={styles.programGrid}>
            {/* 1. CTC / SALARY - Placement only */}
            {isPlacement && (
              <View style={styles.programItem}>
                <Text style={styles.programIcon}>👛</Text>
                <Text style={styles.programItemValue}>{activeSalary}</Text>
                <Text style={styles.programItemSub}>
                  {salarySubtextLines.join('\n')}
                </Text>
              </View>
            )}

            {/* 2. ROLE / DESIGNATION */}
            <View style={styles.programItem}>
              <Text style={styles.programIcon}>👤</Text>
              <Text style={styles.programItemValue}>{activeTitle}</Text>
              <Text style={styles.programItemSub}>Role Category</Text>
            </View>

            {/* 3. LOCATION */}
            <View style={styles.programItem}>
              <Text style={styles.programIcon}>📍</Text>
              <Text style={styles.programItemValue}>{activeLocation}</Text>
              <Text style={styles.programItemSub}>
                {locationSubtextLines.join('\n')}
              </Text>
            </View>

            {/* 4. TRAINING DURATION */}
            <View style={styles.programItem}>
              <Text style={styles.programIcon}>🕒</Text>
              <Text style={styles.programItemValue}>{activeTrainingPeriod}</Text>
              <Text style={styles.programItemSub}>
                {trainingSubtextLines.join('\n')}
              </Text>
            </View>

            {/* 5. STIPEND - Placement & Internship */}
            {!isCourse && (
              <View style={styles.programItem}>
                <Text style={styles.programIcon}>💵</Text>
                <Text style={styles.programItemValue}>{activeStipend}</Text>
                <Text style={styles.programItemSub}>
                  {stipendSubtextLines.join('\n')}
                </Text>
              </View>
            )}

            {/* 6. FEES - Placement & Course */}
            {!isInternship && (
              <View style={styles.programItem}>
                <Text style={styles.programIcon}>₹</Text>
                <Text style={styles.programItemValue}>{activeFee}</Text>
                <Text style={styles.programItemSub}>{feeSubtext}</Text>
              </View>
            )}

            {/* 7. BOND - Placement only (rendered ONLY if activeBond exists) */}
            {isPlacement && !!activeBond && (
              <View style={styles.programItem}>
                <Text style={styles.programIcon}>🛡️</Text>
                <Text style={styles.programItemValue}>{activeBond}</Text>
                <Text style={styles.programItemSub}>Service Agreement Duration</Text>
              </View>
            )}

            {/* 8. ORIGINALS - Placement only (rendered ONLY if activeOriginals exists) */}
            {isPlacement && !!activeOriginals && (
              <View style={styles.programItem}>
                <Text style={styles.programIcon}>✔️</Text>
                <Text style={[styles.programItemValue, { color: '#B45309' }]}>
                  {activeOriginals}
                </Text>
                <Text style={styles.programItemSub}>
                  Original Certificates Verification & Submission
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Roles & Responsibilities Section */}
        {responsibilitiesList && responsibilitiesList.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>{sectionRespTitle}</Text>
            {responsibilitiesList.map((item, idx) => (
              <View key={idx} style={styles.respRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.respText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Overview Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>{sectionOverviewTitle}</Text>
          <Text style={styles.overviewText}>{activeDesc}</Text>

          {/* Quick Specifications Stacked One by One */}
          <View style={styles.specsBox}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>
                {isCourse
                  ? 'COURSE LOCATION'
                  : isInternship
                  ? 'INTERNSHIP LOCATION'
                  : 'JOB LOCATION'}
              </Text>
              <Text style={styles.specValue}>📍 {currentProcess.location || job.location || 'PAN INDIA'}</Text>
            </View>

            {isPlacement && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>SALARY RANGE</Text>
                <Text style={[styles.specValue, { color: '#059669' }]}>
                  💰 {activeSalary}
                </Text>
              </View>
            )}

            <View style={styles.specItem}>
              <Text style={styles.specLabel}>EXPERIENCE</Text>
              <Text style={styles.specValue}>
                🧳 {currentProcess.experience || job.experience || 'Fresher & Experience'}
              </Text>
            </View>

            <View style={[styles.specItem, styles.specItemLast]}>
              <Text style={styles.specLabel}>QUALIFICATION</Text>
              <Text style={styles.specValue}>
                🎓 {currentProcess.qualification || job.qualification || (isItJob ? 'Any Degree' : 'Graduate')}
              </Text>
            </View>
          </View>
        </View>

        {/* Requirements & Eligibility Section */}
        {requirementsList && requirementsList.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Requirements & Eligibility</Text>
            {requirementsList.map((req, idx) => (
              <View key={idx} style={styles.respRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.respText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Interview Selection Timeline (Placement only) */}
        {isPlacement && interviewRounds && interviewRounds.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Interview Selection</Text>

            <View style={styles.badgesRow}>
              <View style={styles.selectionBadgePurple}>
                <Text style={styles.purpleBadgeText}>🪜 INTERVIEW SELECTION</Text>
              </View>
              <View style={styles.selectionBadgePink}>
                <Text style={styles.pinkBadgeText}>
                  🎯 Total Rounds: {interviewRounds.length}
                </Text>
              </View>
            </View>

            {/* Timeline Track */}
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLine} />

              {interviewRounds.map((step, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.stageCircle}>
                    <Text style={styles.stageNumber}>{step.stepNumber || idx + 1}</Text>
                  </View>
                  <View style={styles.stageCard}>
                    <View style={styles.stageHeaderRow}>
                      <Text style={styles.stageTag}>ROUND {idx + 1}</Text>
                      <Text style={styles.stageSub}>
                        Stage {idx + 1} of {interviewRounds.length}
                      </Text>
                    </View>
                    <Text style={styles.stageTitle}>{step.title}</Text>
                    {step.description ? (
                      <Text style={styles.stageDesc}>{step.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* After Selection Button */}
            <TouchableOpacity
              style={styles.afterSelectionBadge}
              onPress={() => setShowAfterSelection(!showAfterSelection)}
              activeOpacity={0.8}
            >
              <Text style={styles.afterSelectionText}>
                🔖 After Selection {showAfterSelection ? '▲' : '➔'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AFTER SELECTION SECTION (Placement only, Matching Website) */}
        {isPlacement && showAfterSelection && (
          <View style={styles.afterSelectionSection}>
            <View style={styles.afterHeaderBox}>
              <View style={styles.afterIconCircle}>
                <Text style={styles.afterIcon}>🛡️</Text>
              </View>
              <View style={styles.afterHeaderTextCol}>
                <Text style={styles.afterSectionTitle}>
                  After selected the Job Training Program
                </Text>
                <Text style={styles.afterSectionSub}>
                  Structured learning period & stipend progression plan
                </Text>
              </View>
            </View>

            <View style={styles.trainingPhaseBadge}>
              <Text style={styles.trainingPhaseBadgeText}>
                🎓 {trainingPhasesList.length} Training{' '}
                {trainingPhasesList.length === 1 ? 'Phase' : 'Phases'}
              </Text>
            </View>

            {/* Training Phases Cards */}
            {trainingPhasesList.map((phase, idx) => (
              <View key={idx} style={styles.phaseCard}>
                <View style={styles.phaseHeaderRow}>
                  <Text style={styles.phaseTag}>PHASE {idx + 1}</Text>
                  <Text style={styles.phaseStageSub}>
                    Stage {idx + 1} of {trainingPhasesList.length}
                  </Text>
                </View>
                <Text style={styles.phaseTitle}>
                  {phase.title || `Phase ${idx + 1} Training`}
                </Text>
                <View style={styles.phaseGrid}>
                  <View style={styles.phaseCell}>
                    <Text style={styles.phaseCellLabel}>⏱ DURATION</Text>
                    <Text style={styles.phaseCellValue}>
                      {phase.duration || '3 Months'}
                    </Text>
                  </View>
                  <View style={styles.phaseCell}>
                    <Text style={styles.phaseCellLabel}>🏫 MODE</Text>
                    <Text style={styles.phaseCellValue}>
                      {phase.mode || 'Classroom / OJT'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.phaseStipendLabel}>💵 STIPEND / SALARY</Text>
                <Text style={styles.phaseStipendValue}>
                  {phase.stipend || activeStipend}
                </Text>
              </View>
            ))}

            {/* Course / Training Fees Breakdown Card */}
            <View style={styles.feesCard}>
              <View style={styles.feesHeaderRow}>
                <View style={styles.feesTitleRow}>
                  <Text style={styles.feesRibbonIcon}>🏅</Text>
                  <Text style={styles.feesCardTitle}>Course / Training Fees</Text>
                </View>
                <View style={styles.feesRefundBadge}>
                  <Text style={styles.feesRefundBadgeText}>
                    {currentProcess.feeRefundType || job.feeRefundType || '100% Placement Guarantee'}
                  </Text>
                </View>
              </View>

              <Text style={styles.feesSubLabel}>
                COURSE / TRAINING FEE AMOUNT
              </Text>
              <Text style={styles.feesAmountText}>{activeFee}</Text>

              <View
                style={{
                  backgroundColor: '#EFF6FF',
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
              >
                <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '600', lineHeight: 18 }}>
                  ℹ️ {currentProcess.feeRefundDetails || job.feeRefundDetails || '100% money back guarantee upon successful training completion.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Floating Apply Now Button */}
        <TouchableOpacity
          style={styles.applyNowFloatingBtn}
          onPress={() => {
            navigation.navigate('Apply', {
              job: {
                id: currentProcess.id || job.id,
                title: activeTitle,
                company: activeCompany,
                companyName: activeCompany,
                location: activeLocation,
                salary: activeSalary,
              },
            });
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.applyNowFloatingBtnText}>{applyButtonLabel}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Application Modal Popup */}
      <ApplyModal
        visible={applyModalVisible}
        onClose={() => setApplyModalVisible(false)}
        job={{
          id: currentProcess.id || job.id,
          title: activeTitle,
          company: activeCompany,
          companyName: activeCompany,
          location: activeLocation,
          salary: activeSalary,
        }}
        onSuccess={(applicationId) => {
          navigation.navigate('ApplicationSuccess', {
            jobTitle: activeTitle,
            company: activeCompany,
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
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
  content: {
    padding: 16,
  },
  jobTitleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLogoBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  headerLogoImg: {
    width: '100%',
    height: '100%',
  },
  headerTitleColumn: {
    flex: 1,
  },
  jobTitleMain: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  jobCompanySub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  processSwitcherContainer: {
    marginBottom: 16,
  },
  processTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  processTabBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  processTabText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#475569',
  },
  processTabTextActive: {
    color: '#FFFFFF',
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  programItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  programIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  programItemValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  programItemSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    fontWeight: '500',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  respRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkIcon: {
    color: '#10B981',
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
    fontWeight: '800',
  },
  bulletDot: {
    color: '#2563EB',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
    fontWeight: '800',
  },
  respText: {
    flex: 1,
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  overviewText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 14,
  },
  specsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specItem: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  specItemLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 3,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  selectionBadgePurple: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  purpleBadgeText: {
    color: '#7E22CE',
    fontSize: 11.5,
    fontWeight: '800',
  },
  selectionBadgePink: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  pinkBadgeText: {
    color: '#7E22CE',
    fontSize: 11.5,
    fontWeight: '700',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 20,
    marginBottom: 14,
  },
  timelineLine: {
    position: 'absolute',
    left: 10,
    top: 15,
    bottom: 25,
    width: 2.5,
    backgroundColor: '#9333EA',
    borderRadius: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stageCircle: {
    position: 'absolute',
    left: -20,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7E22CE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  stageNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stageCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    marginLeft: 14,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stageTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E22CE',
  },
  stageSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  stageTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  stageDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
  },
  afterSelectionBadge: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  afterSelectionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  afterSelectionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  afterHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  afterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  afterIcon: {
    fontSize: 18,
  },
  afterHeaderTextCol: {
    flex: 1,
  },
  afterSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  afterSectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  trainingPhaseBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  trainingPhaseBadgeText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '800',
  },
  phaseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  phaseTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phaseStageSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  phaseGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phaseCell: {
    flex: 1,
  },
  phaseCellLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  phaseCellValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  phaseStipendLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  phaseStipendValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#047857',
  },
  feesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    marginTop: 4,
  },
  feesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feesRibbonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  feesCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  feesRefundBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feesRefundBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  feesSubLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  feesAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  applyNowFloatingBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  applyNowFloatingBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
