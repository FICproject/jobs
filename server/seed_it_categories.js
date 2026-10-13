const mongoose = require('mongoose');
const { ItTrainingProcessModel, initialData } = require('./db');

mongoose.connect('mongodb+srv://JobPortal:vmjpDTY7R3TPSmPA@cluster0.wkptyao.mongodb.net/recruitment_db?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    // 1. Update existing null/undefined itCategory to Placement
    const uRes = await ItTrainingProcessModel.updateMany(
      { $or: [{ itCategory: { $exists: false } }, { itCategory: null }, { itCategory: '' }] },
      { $set: { itCategory: 'Placement' } }
    );
    console.log('Updated to Placement:', uRes.modifiedCount);

    const internships = [
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
        feeSubtext: 'Zero Cost • Real Experience',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Work on live production web apps using React, Node.js, and databases alongside experienced software leads. Build real portfolio projects without paying any fees.',
        order: 20,
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
        feeSubtext: 'Zero Cost • Real Experience',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Hands-on live project internship in Python, Django/FastAPI, API integrations, and machine learning pipelines under industry mentorship.',
        order: 21,
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
        feeSubtext: 'Zero Cost • Real Experience',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Real industry experience building Java, Spring Boot microservices, REST APIs, and database transactions in commercial projects.',
        order: 22,
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
        feeSubtext: 'Zero Cost • Real Experience',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Join our exclusive 100% Free Internship program. Work on live industry projects alongside experienced developers without paying any fees.',
        order: 23,
        status: 'Active'
      }
    ];

    const courses = [
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
        feeSubtext: 'Course Fees (One-time payment)',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Master HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, and Git. Build 5+ portfolio projects with code reviews and certificate.',
        order: 30,
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
        feeSubtext: 'Course Fees (One-time payment)',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Comprehensive Python training covering programming fundamentals, Pandas, NumPy, Scikit-Learn, data visualization, and AI APIs.',
        order: 31,
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
        feeSubtext: 'Course Fees (One-time payment)',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Learn Core Java, OOP principles, Spring Boot framework, RESTful web services, Hibernate/JPA, and microservices architecture.',
        order: 32,
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
        feeSubtext: 'Course Fees (One-time payment)',
        bondPeriod: 'No Bond',
        originalsRequired: 'Not Required',
        description: 'Enroll in our comprehensive IT training courses designed for beginners to advanced professionals. Build real-world projects and accelerate your career.',
        order: 33,
        status: 'Active'
      }
    ];

    for (const item of [...internships, ...courses]) {
      const exists = await ItTrainingProcessModel.findOne({ id: item.id });
      if (!exists) {
        await ItTrainingProcessModel.create(item);
        console.log('Created:', item.id, item.itCategory, item.role);
      } else {
        await ItTrainingProcessModel.updateOne({ id: item.id }, { $set: item });
        console.log('Updated:', item.id);
      }
    }
    console.log('Successfully synchronized all IT categories in MongoDB!');
    process.exit(0);
  })
  .catch(err => { console.error('Error:', err); process.exit(1); });
