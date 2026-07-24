export type ProjectTemplate = {
  title: string;
  category: string;
  goal: string;
  icon: string;
  accentColor: string;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    title: "CAT",
    category: "Exams",
    goal: "Prepare for the Common Admission Test (CAT) with structured practice and strategy",
    icon: "GraduationCap",
    accentColor: "#6366f1",
  },
  {
    title: "UPSC",
    category: "Exams",
    goal: "Build a comprehensive UPSC civil services preparation plan",
    icon: "Landmark",
    accentColor: "#f59e0b",
  },
  {
    title: "AWS",
    category: "Certification",
    goal: "Master AWS cloud services and pass certification exams",
    icon: "Cloud",
    accentColor: "#f97316",
  },
  {
    title: "React",
    category: "Programming",
    goal: "Become proficient in React and modern frontend development",
    icon: "Code2",
    accentColor: "#06b6d4",
  },
  {
    title: "Japanese",
    category: "Language",
    goal: "Learn Japanese from beginner to conversational fluency",
    icon: "Languages",
    accentColor: "#ec4899",
  },
  {
    title: "Python",
    category: "Programming",
    goal: "Learn Python programming for data science and automation",
    icon: "Terminal",
    accentColor: "#22c55e",
  },
  {
    title: "Machine Learning",
    category: "Data Science",
    goal: "Understand machine learning fundamentals and build practical models",
    icon: "Brain",
    accentColor: "#8b5cf6",
  },
];
