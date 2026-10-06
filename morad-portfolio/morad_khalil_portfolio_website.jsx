export default function Portfolio() {
  const projects = [
    {
      title: "AI Code Assistant Chatbot",
      description:
        "An AI-powered chatbot that explains uploaded code files, detects syntax and logical errors, and provides corrected solutions using Groq LLM API integration.",
      tech: ["Python", "Streamlit", "Groq API", "Prompt Engineering"],
      github: "https://github.com/morad-breje/morad/tree/main/ai-code-assistant-chatbot",
    },
    {
      title: "Planet Donuts Website",
      description:
        "A fully functional donut shop web application featuring order management, admin dashboard, REST APIs, menu system, and responsive frontend pages.",
      tech: ["Flask", "SQLite", "HTML", "CSS", "JavaScript"],
      github: "https://github.com/morad-breje/morad/tree/main/astro-donuts",
    },
    {
      title: "CPU Scheduling Simulator",
      description:
        "A scheduling simulator implementing FCFS, Round Robin, and Priority Scheduling algorithms with performance metrics and API-based simulation.",
      tech: ["Python", "Flask", "Algorithms", "REST APIs"],
      github: "https://github.com/morad-breje/morad/tree/main/cpu-scheduling-simulator",
    },
  ];

  const skills = [
    "Python",
    "Flask",
    "Streamlit",
    "REST APIs",
    "Prompt Engineering",
    "AI Chatbots",
    "Machine Learning",
    "SQL",
    "GitHub",
    "Docker",
    "HTML/CSS",
    "JavaScript",
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-8 py-24 text-center bg-gradient-to-b from-zinc-900 to-black">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">
            Morad Khalil
          </h1>

          <p className="text-2xl text-orange-400 font-medium mb-4">
            Computer Science Student • Backend Developer • AI Enthusiast
          </p>

          <p className="text-zinc-300 text-lg leading-8 max-w-3xl mx-auto mb-10">
            Passionate about building intelligent systems, AI-powered applications,
            and modern web platforms using Python, Flask, Streamlit, and advanced
            prompt engineering techniques.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="#projects"
              className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 transition text-lg font-semibold shadow-lg"
            >
              View Projects
            </a>

            <a
              href="mailto:khalilmorad92@gmail.com"
              className="px-8 py-4 rounded-2xl border border-zinc-700 hover:border-orange-500 transition text-lg font-semibold"
            >
              Contact Me
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-10">About Me</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <p className="text-zinc-300 leading-8 text-lg">
            I am a Computer Science student at Applied Science Private University
            (ASU) with experience in backend development, AI-powered applications,
            and modern web technologies. I worked as a Backend Developer at
            Replit Jordan where I contributed to backend systems, APIs, and AI
            workflows.
          </p>

          <p className="text-zinc-300 leading-8 text-lg mt-6">
            My focus is on developing scalable software systems, intelligent
            automation tools, and interactive web applications that solve
            real-world problems.
          </p>
        </div>
      </section>

      {/* Skills */}
      <section className="px-8 py-20 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Technical Skills</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center hover:border-orange-500 transition"
              >
                <p className="text-lg font-medium">{skill}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="px-8 py-20 max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold mb-14 text-center">Projects</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-orange-500 transition-all shadow-2xl"
            >
              <div className="h-56 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl font-bold">
                {project.title}
              </div>

              <div className="p-7">
                <h3 className="text-2xl font-bold mb-4">
                  {project.title}
                </h3>

                <p className="text-zinc-300 leading-7 mb-6">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 transition font-semibold"
                >
                  View Project
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="px-8 py-20 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Experience</h2>

          <div className="space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-orange-400">
                Backend Developer — Replit Jordan
              </h3>
              <p className="text-zinc-400 mb-4">May 2023 – Present</p>
              <ul className="space-y-3 text-zinc-300 leading-7 list-disc list-inside">
                <li>Developed backend systems and APIs for web applications.</li>
                <li>Built AI-powered tools and intelligent chatbot systems.</li>
                <li>Worked on prompt engineering and automation workflows.</li>
                <li>Improved application scalability and performance.</li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-orange-400">
                Software Development Intern — Tamatem Games
              </h3>
              <p className="text-zinc-400 mb-4">June 2022 – September 2022</p>
              <ul className="space-y-3 text-zinc-300 leading-7 list-disc list-inside">
                <li>Participated in software development workflows.</li>
                <li>Assisted in debugging and application testing.</li>
                <li>Collaborated with developers in agile environments.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-8 py-24 text-center">
        <h2 className="text-5xl font-bold mb-8">Let’s Connect</h2>

        <p className="text-zinc-300 text-lg mb-10 max-w-2xl mx-auto">
          Interested in collaborating, hiring, or discussing AI and backend
          development opportunities? Feel free to reach out.
        </p>

        <div className="flex justify-center gap-5 flex-wrap">
          <a
            href="mailto:khalilmorad92@gmail.com"
            className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 transition text-lg font-semibold"
          >
            Email Me
          </a>

          <a
            href="https://github.com/morad-breje"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-2xl border border-zinc-700 hover:border-orange-500 transition text-lg font-semibold"
          >
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
