const { parseWorkExperience } = require('./utils/workExperienceParser');
const { calculateWorkExperienceScore } = require('./utils/scoringEngine');

// Test cases with different types of researcher profiles
const testCases = [
  {
    name: "Senior AI Research Scientist",
    profile: {
      name: "Dr. Alex Chen",
      bio: "Senior Research Scientist at Google DeepMind with 8 years of experience in machine learning and computer vision. Led multiple AI research projects and published 30+ papers. Expertise in TensorFlow, PyTorch, and JAX. Currently mentoring PhD students and junior researchers.",
      experience: "8 years at Google, 3 years at Microsoft Research",
      skills: ["Machine Learning", "Computer Vision", "TensorFlow", "PyTorch", "Leadership"],
      achievements: ["Led team of 12 researchers", "Published 30+ papers", "Keynote speaker at NeurIPS"],
      description: "Test Case 1: Senior researcher with clear experience and mentorship"
    }
  },
  {
    name: "AI Startup Founder",
    profile: {
      name: "Sarah Johnson",
      bio: "Founder and CTO of AI startup focused on autonomous systems. Previously worked at Tesla's Autopilot team for 5 years. Expert in deep learning frameworks including PyTorch and CUDA programming. Built and scaled ML infrastructure serving millions of users.",
      experience: "5 years at Tesla, 2 years startup founder",
      skills: ["Deep Learning", "Autonomous Systems", "PyTorch", "CUDA", "MLOps"],
      achievements: ["Founded successful AI startup", "Led Autopilot development", "Scaled ML to millions of users"],
      description: "Test Case 2: Industry leader with startup experience"
    }
  },
  {
    name: "Academic Researcher",
    profile: {
      name: "Prof. Michael Rodriguez",
      bio: "Professor of Computer Science at MIT specializing in natural language processing. 12 years of research experience with expertise in Hugging Face Transformers and TensorFlow. Supervises 8 PhD students and teaches graduate-level AI courses.",
      experience: "12 years in academia, 3 years at IBM Research",
      skills: ["Natural Language Processing", "Transformers", "TensorFlow", "Hugging Face", "Teaching"],
      achievements: ["Supervises 8 PhD students", "50+ publications", "NSF grant recipient"],
      description: "Test Case 3: Academic with strong mentorship role"
    }
  },
  {
    name: "Junior ML Engineer",
    profile: {
      name: "Emily Zhang",
      bio: "Machine Learning Engineer at a tech startup with 2 years of experience. Working on recommendation systems using scikit-learn and TensorFlow. Recently completed ML bootcamp and eager to learn more about deep learning.",
      experience: "2 years at tech startup",
      skills: ["Machine Learning", "Recommendation Systems", "Scikit-learn", "TensorFlow"],
      achievements: ["Improved recommendation accuracy by 15%", "Completed ML bootcamp"],
      description: "Test Case 4: Junior engineer with limited experience"
    }
  },
  {
    name: "Research Scientist with Mixed Background",
    profile: {
      name: "Dr. James Kim",
      bio: "Research Scientist with experience at both academia and industry. Worked at Stanford AI Lab for 4 years, then joined OpenAI for 3 years. Expert in multiple frameworks including JAX, PyTorch, and TensorFlow. Co-authored several influential papers in computer vision and has mentored numerous interns.",
      experience: "4 years at Stanford, 3 years at OpenAI",
      skills: ["Computer Vision", "JAX", "PyTorch", "TensorFlow", "Research"],
      achievements: ["Co-authored influential papers", "Mentored 15+ interns", "Speaking at conferences"],
      description: "Test Case 5: Mixed academic-industry background"
    }
  }
];

async function runTests() {
  console.log('🧪 Testing Work Experience Parser\n');
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Description: `, testCase);
    
    try {
      const result = await parseWorkExperience(testCase.profile);
      
      console.log('\n📊 RESULTS:');
      console.log(`  Processing Time: ${result.processingTime}ms`);
      console.log(`  Extraction Method: ${result.extractionMethod}`);
      console.log(`  Top AI Organizations: [${result.topAIOrganizations.join(', ')}]`);
      console.log(`  Impact Quality: ${result.impactQuality}/4`);
      console.log(`  Mentorship Role: ${result.mentorshipRole}`);
      console.log(`  DL Frameworks: [${result.dlFrameworks.join(', ')}]`);
      console.log(`  Years of Experience: ${result.yearsOfExperience}`);
      console.log(`  Reasoning: ${result.reasoning}`);
      
      // Test scoring integration
      const workExperienceScore = calculateWorkExperienceScore(result);
      console.log(`\n🎯 SCORING BREAKDOWN:`);
      console.log(`  Top AI Organizations: ${result.topAIOrganizations.length > 0 ? Math.min(result.topAIOrganizations.length, 2) : 0}/2 points`);
      console.log(`  Impact Quality: ${result.impactQuality}/4 points`);
      console.log(`  Mentorship Role: ${result.mentorshipRole ? 2 : 0}/2 points`);
      console.log(`  DL Frameworks: ${result.dlFrameworks.length > 0 ? Math.min(result.dlFrameworks.length * 0.5, 2) : 0}/2 points`);
      console.log(`  TOTAL WORK EXPERIENCE SCORE: ${workExperienceScore}/10 points`);
      
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All tests completed!');
  
  // Test scoring edge cases
  console.log('\n' + '='.repeat(60));
  console.log('SCORING EDGE CASES TEST');
  console.log('='.repeat(60));
  
  const edgeCases = [
    {
      name: "Maximum Score Case",
      data: {
        topAIOrganizations: ["Google", "Microsoft", "OpenAI"],
        impactQuality: 4,
        mentorshipRole: true,
        dlFrameworks: ["TensorFlow", "PyTorch", "JAX", "Keras"]
      }
    },
    {
      name: "Minimum Score Case", 
      data: {
        topAIOrganizations: [],
        impactQuality: 1,
        mentorshipRole: false,
        dlFrameworks: []
      }
    },
    {
      name: "Partial Score Case",
      data: {
        topAIOrganizations: ["Google"],
        impactQuality: 2,
        mentorshipRole: true,
        dlFrameworks: ["PyTorch"]
      }
    }
  ];
  
  edgeCases.forEach(testCase => {
    const score = calculateWorkExperienceScore(testCase.data);
    console.log(`\n${testCase.name}:`);
    console.log(`  Data: ${JSON.stringify(testCase.data)}`);
    console.log(`  Score: ${score}/10 points`);
  });
}

// Run tests
runTests().catch(console.error); 