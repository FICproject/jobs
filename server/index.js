require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/interviews');
const reportRoutes = require('./routes/reports');
const itTrainingRoutes = require('./routes/itTraining');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Uploads directory static serving
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Logos directory static serving
const logosDir = path.join(__dirname, 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}
app.use('/logos', express.static(logosDir));

// Sample dummy resume creation for seed candidate if missing
const sampleResumePath = path.join(uploadsDir, 'sample_resume_rahul.pdf');
if (!fs.existsSync(sampleResumePath)) {
  fs.writeFileSync(sampleResumePath, 'Sample Resume Content for Rahul Sharma - B.Com Graduate');
}

const userRoutes = require('./routes/users');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/it-training-processes', itTrainingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Recruitment Portal API Server is running.' });
});

// Candidate APK Download endpoint
app.get('/api/download/candidate-apk', (req, res) => {
  const candidateApkPath = path.join(uploadsDir, 'CandidateApp.apk');
  const rootCandidateApkPath = path.join(__dirname, '..', 'CandidateApp.apk');
  const builtApkPath = path.join(__dirname, '..', 'candidate_mobile', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

  let targetPath = null;
  if (fs.existsSync(candidateApkPath)) targetPath = candidateApkPath;
  else if (fs.existsSync(rootCandidateApkPath)) targetPath = rootCandidateApkPath;
  else if (fs.existsSync(builtApkPath)) targetPath = builtApkPath;

  if (targetPath) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.download(targetPath, 'CandidateRecruitPro.apk', (err) => {
      if (err) console.error('Error downloading Candidate APK:', err);
    });
  } else {
    res.status(404).json({ error: 'Candidate APK not found. Please build or upload the APK.' });
  }
});

// IT Training Incentives settings endpoints
let globalItIncentives = { 'PROCESS 1': 10000, 'PROCESS 2': 15000, 'PROCESS 3': 10000 };
app.get('/api/settings/it-training-incentives', (req, res) => {
  res.json(globalItIncentives);
});
app.post('/api/settings/it-training-incentives', (req, res) => {
  globalItIncentives = { ...globalItIncentives, ...req.body };
  res.json(globalItIncentives);
});

// Partner Incentives endpoints
let partnerIncentivesStore = [];
app.get('/api/partner-incentives', (req, res) => {
  const { hrId } = req.query;
  if (hrId) {
    return res.json(partnerIncentivesStore.filter(p => p.hrId === hrId));
  }
  res.json(partnerIncentivesStore);
});
app.post('/api/partner-incentives', (req, res) => {
  const { hrId, jobId } = req.body;
  const idx = partnerIncentivesStore.findIndex(p => p.hrId === hrId && p.jobId === jobId);
  if (idx !== -1) {
    partnerIncentivesStore[idx] = { ...partnerIncentivesStore[idx], ...req.body };
  } else {
    partnerIncentivesStore.push(req.body);
  }
  res.json({ success: true, item: req.body });
});

const { connectMongoDB } = require('./db');

// Connect to MongoDB Database
connectMongoDB();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Recruitment Portal Backend running on http://localhost:${PORT}`);
});
