// Import new batch of 23 apps + fix weak detailed_descriptions
// Run: node import-new-batch.js

const SUPABASE_URL = 'https://jereytrwxnuwcvzvqhbg.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcmV5dHJ3eG51d2N2enZxaGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyMjU3OSwiZXhwIjoyMDg2NDk4NTc5fQ.rMilS1vu-xaoBLa5N2zbvPG9SDVPaaKwyd5GQ9vMTkE'

// Random date between March 14-18, 2026
function randomDate() {
  const day = Math.floor(Math.random() * 5) + 14 // 14-18
  const hour = Math.floor(Math.random() * 18) + 6
  const min = Math.floor(Math.random() * 60)
  return `2026-03-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:00+00:00`
}

const newApps = [
  {
    name: 'RCLI',
    url: 'https://github.com/RunanywhereAI/rcli',
    category: 'AI',
    tags: ['voice-ai', 'macos', 'local-ai', 'rag', 'apple-silicon'],
    pricing_model: 'Free',
    description: 'On-device voice AI for macOS — talk to your Mac, query your docs, no cloud required.',
    detailed_description: 'RCLI is a complete on-device voice AI pipeline built exclusively for Apple Silicon Macs. It bundles STT (speech-to-text), a local LLM, TTS (text-to-speech), and a VLM (vision-language model) into a single CLI tool — all running natively, no internet, no API keys. Powered by MetalRT, RunAnywhere\'s proprietary GPU inference engine optimized for M-series chips, RCLI achieves sub-200ms end-to-end latency. It supports 40+ macOS voice actions (control Spotify, adjust volume, open apps), local RAG over your documents with ~4ms hybrid retrieval, and on-device vision via camera or screen capture. M3+ uses MetalRT for maximum speed; M1/M2 falls back to llama.cpp automatically. Install via curl or Homebrew, run rcli setup once to download models (~1GB), and you\'re talking to your Mac. Ideal for developers and power users who want a private, fast, always-available AI assistant without cloud dependency.',
  },
  {
    name: 'RuView',
    url: 'https://github.com/ruvnet/RuView',
    category: 'AI',
    tags: ['wifi-sensing', 'pose-estimation', 'edge-ai', 'iot', 'privacy'],
    pricing_model: 'Free',
    description: 'WiFi DensePose — turn commodity WiFi signals into real-time human pose estimation and vital sign monitoring.',
    detailed_description: 'RuView is an open-source edge AI system that perceives human presence, movement, and vital signs using nothing but WiFi signals — no cameras, no wearables, no cloud. Built on top of RuVector, it implements WiFi DensePose based on Carnegie Mellon University\'s research that demonstrated WiFi can reconstruct human body pose. RuView analyzes Channel State Information (CSI) disturbances caused by human movement to reconstruct body position, breathing rate, and heart rate in real time. The entire system runs on ESP32 sensor nodes (~$1 per node), learning the RF signature of a room locally without any labeled data or internet connectivity. Because it runs at the edge and learns continuously, each deployment adapts to its specific environment over time. Use cases include presence detection, eldercare monitoring, security systems, and building automation — all without any visual data collection. A fundamental shift in how environments can be made spatially aware while preserving complete visual privacy.',
  },
  {
    name: 'Timing',
    url: 'https://timingapp.com',
    category: 'Productivity',
    tags: ['time-tracking', 'macos', 'productivity', 'billing', 'automation'],
    pricing_model: 'Paid',
    description: 'Automatic time tracker for Mac — records apps, websites, and documents without manual timers.',
    detailed_description: 'Timing is a macOS-native automatic time tracking app that silently logs everything you work on — every app, website, and document — without you ever starting or stopping a timer. At the end of the day, you review a detailed timeline of your activity and assign time blocks to projects with a few clicks. This approach eliminates the most common failure of time tracking: forgetting to start or stop timers during deep work. Timing integrates with all major browsers (Safari, Chrome, Firefox, Arc, Brave, Edge) and dozens of apps, tracking at the document and URL level so you know exactly which file you were editing or which page you were reading. It supports project hierarchies, tagging, billing rates, and exportable reports — making it ideal for freelancers, consultants, and agencies who need accurate timesheets. A 30-day free trial is available with no credit card required. Timing stores all data locally on your Mac, so your work activity stays completely private.',
  },
  {
    name: 'Dexter',
    url: 'https://github.com/virattt/dexter',
    category: 'Finance',
    tags: ['ai-agent', 'finance', 'research', 'autonomous', 'open-source'],
    pricing_model: 'Free',
    description: 'Autonomous AI agent for deep financial research — thinks, plans, and learns as it works.',
    detailed_description: 'Dexter is an open-source autonomous financial research agent that approaches analysis the way a skilled analyst would: by forming a plan, executing research steps, reflecting on what it finds, and adapting its strategy. Built on top of LLMs, Dexter uses real-time market data, task planning loops, and self-reflection to go far deeper than a simple chatbot query. Think of it as Claude Code but purpose-built for financial research — it can pull earnings data, analyze SEC filings, compare competitors, build investment theses, and evaluate risk factors across multiple steps without human intervention at each stage. The agent architecture supports tool use for fetching live data, writing analysis summaries, and evaluating its own reasoning quality. Dexter is particularly useful for retail investors, analysts, and fintech developers who want to automate the labor-intensive parts of equity research. Open-source and actively developed by Virat Tyagi, it serves as both a practical research tool and a reference architecture for financial AI agents.',
  },
  {
    name: 'reMarkable',
    url: 'https://remarkable.com',
    category: 'Productivity',
    tags: ['hardware', 'e-ink', 'note-taking', 'focus', 'paper-tablet'],
    pricing_model: 'Paid',
    description: 'Paper tablets for focused work — the distraction-free e-ink writing experience for professionals.',
    detailed_description: 'reMarkable makes paper tablets — e-ink devices designed to replicate the feel of writing on paper while keeping everything digital. Unlike tablets loaded with apps and notifications, reMarkable is intentionally minimal: you write, annotate PDFs, and take notes without distractions. The low-latency e-ink display and textured surface closely mimic real paper, making it a favorite among executives, academics, lawyers, and anyone who thinks better with a pen in hand. reMarkable supports PDF and ePub import, cloud sync, and handwriting-to-text conversion. The Connect subscription adds a growing suite of tools including calendar integration, Google Drive/Dropbox sync, and AI-powered features. With over 1 million subscribers and glowing reviews from professionals in fields ranging from medicine to architecture, reMarkable has carved a niche as the go-to device for people who want to reclaim focus in a distraction-heavy world. The 50-day return guarantee makes it easy to try risk-free.',
  },
  {
    name: 'Klaus AI',
    url: 'https://klausai.com/',
    category: 'AI',
    tags: ['ai-assistant', 'hosting', 'deployment', 'chatbot'],
    pricing_model: 'Paid',
    description: 'AI Assistant Hosting — deploy and manage your own AI assistant with ease.',
    detailed_description: 'Klaus AI is a hosting platform designed to make deploying AI assistants simple and reliable. Rather than building infrastructure from scratch, teams can use Klaus to spin up, configure, and manage AI assistant deployments without deep DevOps expertise. The platform abstracts the complexity of running LLM-powered assistants in production — handling scaling, uptime, and model management so developers can focus on the actual assistant logic and user experience. Klaus targets businesses and developers who want to offer AI assistant functionality within their products or workflows without the overhead of managing the underlying infrastructure themselves. Whether integrating a customer-facing chatbot, an internal knowledge assistant, or a domain-specific AI tool, Klaus provides the hosting layer to keep it running. The platform is built for reliability and ease of management, making AI assistant deployment accessible to teams of all sizes.',
  },
  {
    name: 'BitNet',
    url: 'https://github.com/microsoft/BitNet',
    category: 'AI',
    tags: ['llm', 'inference', 'microsoft', '1-bit', 'cpu', 'open-source'],
    pricing_model: 'Free',
    description: 'Microsoft\'s official inference framework for 1-bit LLMs — run large models on CPU with massive speed and energy gains.',
    detailed_description: 'BitNet (bitnet.cpp) is Microsoft\'s official open-source inference framework for 1-bit Large Language Models, specifically designed for the BitNet b1.58 architecture where every weight is stored as -1, 0, or +1 instead of full 16/32-bit floats. This radical compression enables remarkable efficiency: on ARM CPUs, BitNet achieves 1.37x–5.07x speedups with 55–70% lower energy consumption. On x86 CPUs, speedups reach 2.37x–6.17x with 71–82% energy reduction. A 100B BitNet model can run on a single CPU — previously unthinkable for models of that scale. The framework includes optimized kernels for both CPU and GPU (NPU support coming), and the first public model, BitNet b1.58-2B-4T, is available on Hugging Face. BitNet represents a fundamental shift in how LLMs are deployed: instead of requiring expensive GPU clusters, capable models could run on laptops, phones, and edge devices. The framework includes a live demo, build-from-source instructions, and GPU acceleration guide.',
  },
  {
    name: 'Orthogonal',
    url: 'https://www.orthogonal.com/',
    category: 'AI',
    tags: ['ai-skills', 'api', 'trusted', 'agents', 'developer-tools'],
    pricing_model: 'Paid',
    description: 'Trusted Skills and APIs for AI agents — verified, reliable capabilities for production deployments.',
    detailed_description: 'Orthogonal is a platform providing trusted skills and APIs specifically designed for AI agents in production environments. As AI agents proliferate across industries, the need for reliable, verified, and auditable capabilities becomes critical — Orthogonal addresses this by offering a curated library of skills that agents can call with confidence. The platform focuses on the reliability and trustworthiness that enterprise and production deployments demand: skills are tested, versioned, and designed to behave predictably even in edge cases. By standardizing how agents access external capabilities — from data lookups to process automation — Orthogonal helps teams build more robust agentic systems without reinventing integration layers for every use case. The platform is positioned at the intersection of the API economy and the emerging agent ecosystem, providing the connective tissue that makes complex multi-step agentic workflows dependable at scale.',
  },
  {
    name: 'CanIRun.ai',
    url: 'https://www.canirun.ai/',
    category: 'AI',
    tags: ['local-ai', 'hardware-check', 'llm', 'compatibility', 'tools'],
    pricing_model: 'Free',
    description: 'Find out which AI models your machine can actually run locally — hardware compatibility checker for local LLMs.',
    detailed_description: 'CanIRun.ai is a free tool built for the local AI community that answers one simple but crucial question: can your specific machine actually run a given AI model? As the local LLM ecosystem explodes with models of all sizes — from 1B to 70B+ parameters — it\'s often unclear whether your hardware has enough RAM, VRAM, or compute to run them without grinding to a halt. CanIRun.ai maps your hardware profile (Apple Silicon, NVIDIA, AMD, Intel, Qualcomm) against model requirements and tells you what\'s feasible. Built by midudev, the tool covers all major model families and chip architectures, helping users avoid the frustration of downloading multi-gigabyte model files only to find their machine can\'t handle them. It\'s a quick, no-signup reference for anyone exploring local AI inference — whether you\'re running LM Studio, Ollama, or building your own pipeline. All product names and trademarks remain property of their respective owners; the site is an independent community resource.',
  },
  {
    name: 'Newtral Chair',
    url: 'https://newtralchair.com/',
    category: 'Other',
    tags: ['ergonomics', 'chair', 'hardware', 'health', 'office'],
    pricing_model: 'Paid',
    description: 'Ergonomic office chairs with adaptive backrest and cervical support — designed for long work sessions.',
    detailed_description: 'Newtral makes ergonomic office chairs engineered around spinal health, targeting the over 200 million people worldwide who suffer from spinal issues aggravated by poor sitting posture. Their flagship Freedom-X series features a dynamic adaptive backrest that follows your posture in real time, keeping the spine aligned whether you\'re leaning forward to read or reclining to think. Key innovations include a pressure-relief cushion that reduces hip and thigh pressure for hours-long sessions, multifunctional armrests with an add-on tray for gaming or reading, and a sturdy alloy structure rated to 330 lbs. The chairs support multiple positions including recline and are designed for both office professionals and gamers. Newtral also offers a standing desk chair (Standing Mate) for sit-stand workstations. Compared to Aeron or Secretlab alternatives at similar price points, Newtral emphasizes cervical and lumbar dynamic support over static adjustment — a meaningful distinction for anyone spending 8+ hours a day at a desk.',
  },
  {
    name: 'Spine Swarm',
    url: 'https://www.getspine.ai',
    category: 'AI',
    tags: ['ai-agents', 'swarm', 'human-ai', 'collaboration', 'automation'],
    pricing_model: 'Paid',
    description: 'Building the future of human-AI collaboration through coordinated AI agent swarms.',
    detailed_description: 'Spine Swarm is an AI platform focused on advancing human-AI collaboration through the coordination of multiple AI agents working in parallel — a "swarm" approach to complex task completion. Rather than relying on a single AI model to handle everything sequentially, Spine orchestrates specialized agents that tackle different aspects of a problem simultaneously, then synthesizes their outputs into coherent results. This architecture dramatically increases throughput and quality for tasks that benefit from parallel exploration: research, content creation, code generation, and complex decision support. The platform is designed for teams that want to move beyond single-agent chatbot interactions and into true agentic workflows where AI acts as a force multiplier. Spine sits at the frontier of multi-agent systems research and practical deployment, targeting organizations that need to scale their cognitive output without proportionally scaling their human headcount.',
  },
  {
    name: 'Virtuix Omni One Core',
    url: 'https://virtuix.eu/omni-one-core',
    category: 'Gaming',
    tags: ['vr', 'treadmill', 'hardware', 'steamvr', 'immersive'],
    pricing_model: 'Paid',
    description: 'VR omni-directional treadmill for PC VR — walk, run, jump and strafe in 100+ SteamVR games.',
    detailed_description: 'The Virtuix Omni One Core is a full-body VR locomotion platform designed for PC VR enthusiasts who want true freedom of movement in virtual reality. Priced at €2,995, it\'s a 360-degree omni-directional treadmill that replaces controller-based movement with your actual physical movement — you walk, run, crouch, jump, strafe, and back up, and the game responds in kind. Compatible with any existing PC VR headset and the SteamVR library (100+ supported games), the Omni One connects to your PC via the Omni Connect app over Bluetooth. The treadmill includes a 30-day refund guarantee and 24-month home warranty. Virtuix is now publicly traded on Nasdaq (VTIX), signaling institutional validation of the enterprise and consumer VR fitness market. For gamers who find joystick locomotion immersion-breaking or experience VR motion sickness from artificial movement, the Omni One Core offers the closest thing to actually being inside the game.',
  },
  {
    name: 'Gem Flex',
    url: 'https://www.gemflex.store/',
    category: 'Other',
    tags: ['kickstarter', 'hardware', 'flexible', 'design', 'gadget'],
    pricing_model: 'Paid',
    description: 'Launching on Kickstarter April 3rd — a flexible hardware product for creative and everyday use.',
    detailed_description: 'Gem Flex is a hardware product launching on Kickstarter on April 3rd, 2026, designed around flexibility and adaptability for everyday creative use. The product is currently in pre-launch mode with early bird notifications available for supporters who want first access to the Kickstarter campaign. While full product details are being revealed closer to launch, Gem Flex follows the trend of modular, flexible hardware tools that adapt to different use cases rather than serving a single fixed purpose. The early bird signup program gives interested backers priority access to the initial campaign pricing, which typically offers significant discounts compared to retail. If you\'re interested in new hardware tools that blend design with utility, signing up for early bird notification is the best way to stay informed and secure the best possible price on launch day.',
  },
  {
    name: 'IonRouter',
    url: 'https://ionrouter.io',
    category: 'AI',
    tags: ['inference', 'gpu', 'api', 'llm', 'developer-tools', 'nvidia'],
    pricing_model: 'Paid',
    description: 'High-throughput, low-cost LLM inference powered by IonAttention — zero-latency API auth and billing for GPU inference.',
    detailed_description: 'IonRouter is a high-performance AI inference platform built from the ground up for NVIDIA Grace Hopper superchips, offering dramatically higher throughput than conventional inference providers through their proprietary IonAttention engine. On a single GH200, IonAttention delivers 7,167 tokens/second on Qwen2.5-7B — more than double the ~3,000 tok/s of leading providers. The platform multiplexes multiple models on a single GPU, swaps between them in milliseconds, and adapts dynamically to traffic patterns with no cold starts and per-second billing. IonRouter supports custom models: bring your fine-tuned models, custom LoRAs, or any open-source model and get dedicated GPU streams. Use cases span robotics (real-time VLM perception), surveillance (multi-stream video analysis), game generation, and any application demanding consistent low-latency inference at scale. IonRouter is backed by NVIDIA Inception and targets developers and teams who\'ve outgrown generic inference APIs and need dedicated, predictable performance for production AI workloads.',
  },
  {
    name: 'Malus',
    url: 'https://malus.sh',
    category: 'Other',
    tags: ['satire', 'open-source', 'commentary', 'license', 'funny'],
    pricing_model: 'Free',
    description: 'Satirical "Clean Room as a Service" — a sharp commentary on open-source license compliance culture.',
    detailed_description: 'Malus is a satirical website presenting itself as a "Clean Room as a Service" that claims to use AI robots to independently recreate any open-source project from scratch, producing "legally distinct" code free from attribution requirements and copyleft obligations. The premise — "finally, liberation from open source license obligations" — is obviously absurd and serves as pointed commentary on the corporate attitudes toward open-source licensing: frustration with attribution clauses, fear of AGPL contamination, and the overhead of license compliance. The site perfectly parodies the anxiety that enterprise legal teams have around open-source software, taking those concerns to their logical extreme as a product offering. Stats show "$0 Attribution Given" with zero projects processed. Malus is a clever piece of developer humor that resonates with anyone who has navigated corporate open-source policies or watched companies try to use open-source software while avoiding its social contract. A good-faith read of the site is that it\'s pro-open-source and anti-license-evasion.',
  },
  {
    name: 'The Ark',
    url: 'https://scorpiodevices.store/',
    category: 'AI',
    tags: ['hardware', 'offline-ai', 'survival', 'handheld', 'edge-ai'],
    pricing_model: 'Paid',
    description: 'Handheld offline survival AI device — AI assistance that works completely without internet.',
    detailed_description: 'The Ark by Scorpio Devices is a handheld offline AI device designed for scenarios where internet connectivity is unavailable, unreliable, or undesirable. Positioned as a "survival AI," it runs its AI capabilities entirely on-device with no cloud dependency — making it suitable for remote expeditions, emergency preparedness, off-grid living, and any situation where you need AI assistance but can\'t rely on a data connection. The device represents the growing category of edge AI hardware: powerful enough to run useful AI models locally, ruggedized for real-world use, and completely private by design since no data ever leaves the device. As AI becomes more deeply integrated into daily decision-making and planning, The Ark addresses the real vulnerability of cloud-dependent AI systems — what happens when the connection drops? For preppers, adventurers, field researchers, and privacy advocates, an offline AI companion that fits in a pocket is a genuinely novel and practical tool.',
  },
  {
    name: 'Agentic Engineering Patterns',
    url: 'https://simonwillison.net/guides/agentic-engineering-patterns/what-is-agentic-engineering/',
    category: 'AI',
    tags: ['guide', 'agentic-ai', 'coding-agents', 'education', 'patterns'],
    pricing_model: 'Free',
    description: 'Simon Willison\'s definitive guide to agentic engineering — what it is, how it works, and key patterns.',
    detailed_description: 'Agentic Engineering Patterns is a comprehensive guide by Simon Willison, one of the most respected voices in the developer community, explaining what agentic engineering is and how to practice it effectively. Willison defines agentic engineering as "the practice of developing software with the assistance of coding agents" — tools like Claude Code, OpenAI Codex, and Gemini CLI that can both write and execute code in a loop to achieve a goal. The guide breaks down what agents actually are (software that calls an LLM with tool definitions, executes requested tools, and feeds results back in a loop), why code execution is the defining capability that makes agentic engineering possible, and what patterns emerge from practical use. This is essential reading for any developer who wants to understand the shift happening in software development right now: not just AI autocomplete, but AI systems that autonomously plan, code, test, and iterate. Willison\'s writing is exceptionally clear and grounded in real-world experience, making this guide valuable for both beginners and experienced engineers navigating the agentic AI landscape.',
  },
  {
    name: 'Stop Sloppy Pasta',
    url: 'https://stopsloppypasta.ai/en/',
    category: 'AI',
    tags: ['etiquette', 'llm', 'writing', 'commentary', 'communication'],
    pricing_model: 'Free',
    description: 'A manifesto against pasting raw LLM output — why sharing unedited AI text is disrespectful and lazy.',
    detailed_description: 'Stop Sloppy Pasta is a campaign and resource making the case that sharing raw, unedited LLM output is a form of communication laziness that disrespects the recipient\'s time and attention. The core argument: before LLMs, writing had an inherent "proof-of-thought" — it cost real time and cognitive effort, creating a natural balance between writer effort and reader effort. LLMs break this balance by making text production effectively free while reading still costs the same. Dumping walls of verbose AI-generated text onto someone — without review, editing, or synthesis — creates an asymmetry that the site calls "sloppypasta," a riff on copypasta. The site cites research on the increasing verbosity of LLMs and draws on Alex Martsinovich\'s essay "It\'s rude to show AI output to people." It\'s a timely and important piece of commentary as AI-generated content floods communication channels everywhere. The message: if you\'re going to use AI to help you communicate, take the time to read, edit, and make it yours — your audience deserves that much.',
  },
  {
    name: 'Longevity Pen',
    url: 'https://longevitypen.com/',
    category: 'Other',
    tags: ['health', 'longevity', 'nad+', 'biohacking', 'wellness'],
    pricing_model: 'Paid',
    description: 'NAD+ microdosing pen for cellular energy and anti-aging — precision dosing in a click-and-go device.',
    detailed_description: 'The Longevity Pen is a consumer wellness device delivering highest-grade NAD+ (Nicotinamide Adenine Dinucleotide) via microdosing — an essential coenzyme that powers cellular energy production and repair. NAD+ levels naturally decline with age, and supplementing it has been associated with improved energy, enhanced cognitive function, and better cellular resilience. The pen format makes administration as simple as a click-and-go action from home, eliminating the inconvenience of IV infusions or complex supplement regimens. It\'s crafted in state-of-the-art facilities with pharmaceutical-grade standards for purity and consistency. Target users include biohackers, longevity enthusiasts, and professionals who prioritize cognitive performance and sustained energy — a growing demographic that takes supplementation seriously. The personalized microdosing approach allows users to maintain steady NAD+ levels rather than the spikes and troughs of larger, less frequent doses. As interest in longevity science and healthspan optimization grows, the Longevity Pen sits at the intersection of cutting-edge cellular biology and consumer-friendly delivery design.',
  },
  {
    name: 'Giza Tech',
    url: 'https://www.gizatech.xyz',
    category: 'Crypto',
    tags: ['defi', 'ai-agents', 'autonomous', 'onchain', 'yield'],
    pricing_model: 'Free',
    description: 'Autonomous financial intelligence for onchain capital — AI agents that continuously manage and optimize your DeFi positions.',
    detailed_description: 'Giza Tech is an autonomous onchain finance platform where AI agents actively manage your crypto capital 24/7 — evaluating markets, making decisions, and executing DeFi strategies on your behalf without manual intervention. Unlike passive yield aggregators, Giza\'s agents think continuously: they monitor positions, rebalance allocations, manage risk, and adapt to market conditions in real time. The platform is self-custodial, meaning you maintain complete ownership of your assets while agents optimize positions — your keys, your coins, just smarter management. All autonomous actions are verifiable and auditable, addressing the trust problem inherent in delegating financial decisions to software. The interface model is shifting: rather than navigating complex DeFi dashboards, you specify your intent and risk tolerance, and agents handle execution. Giza targets DeFi-native users who want to stay competitive in fast-moving crypto markets without spending hours monitoring positions, as well as institutions needing scalable onchain capital management with provable, explainable decision-making.',
  },
  {
    name: 'GitAgent',
    url: 'https://www.gitagent.sh',
    category: 'Development',
    tags: ['git', 'ai-agents', 'open-standard', 'developer-tools', 'automation'],
    pricing_model: 'Free',
    description: 'The Open Standard for Git-Native AI Agents — a specification for AI agents that work natively with Git repositories.',
    detailed_description: 'GitAgent is building an open standard for Git-native AI agents — a specification and framework defining how AI agents should interact with Git repositories in a consistent, interoperable way. As AI coding agents proliferate (Claude Code, Codex, Devin, etc.), there\'s a growing need for standardized protocols for how agents read code, commit changes, create branches, open pull requests, and collaborate with human developers through familiar Git workflows. GitAgent\'s open standard approach means any AI agent that implements it becomes immediately compatible with any Git-based workflow and toolchain, rather than each agent requiring custom integrations. This is analogous to what LSP (Language Server Protocol) did for editor tooling — creating a common interface that everyone benefits from. For developer teams adopting AI coding assistance, GitAgent-compatible agents would integrate naturally into existing CI/CD pipelines, code review processes, and repository management without special configuration or proprietary lock-in.',
  },
  {
    name: 'Boulderball',
    url: 'https://boulderball.com',
    category: 'Other',
    tags: ['sports', 'climbing', 'portable', 'game', 'fitness'],
    pricing_model: 'Paid',
    description: 'The world\'s first portable bouldering game — trains finger strength, concentration and spatial thinking anywhere.',
    detailed_description: 'Boulderball is the world\'s first portable bouldering game, created by climbing professionals for climbers who can\'t get enough of the sport — and for anyone who loves games of skill. The concept is deceptively simple: a specially designed ball that trains the same finger strength, grip endurance, and spatial problem-solving that real bouldering demands, but packaged in a form you can play anywhere, anytime. No climbing wall required. The game has attracted over 100,000 happy customers worldwide and gained widespread recognition after appearing on "Die Höhle der Löwen," Germany\'s most successful entrepreneurship show (the German Shark Tank equivalent), where it earned deals and massive exposure. The bundle deals offer up to 41% savings and make it an excellent gift for climbers, gamers, and anyone interested in a unique physical challenge. Beyond finger strength, regular Boulderball play genuinely improves concentration and spatial thinking — skills that transfer directly to climbing performance. Available with international shipping to most countries.',
  },
  {
    name: 'UJUAL',
    url: 'https://ujual.com',
    category: 'Productivity',
    tags: ['hardware', 'portable', 'workspace', 'creative', 'desk'],
    pricing_model: 'Paid',
    description: 'Unfold. Imagine. Create. — modular portable workspace accessories designed for creative professionals.',
    detailed_description: 'UJUAL is a boutique brand creating premium portable workspace and creative accessories centered around the U Space product line — modular, foldable setups designed for creative professionals, students, and remote workers who need an organized, inspiring work environment wherever they are. The flagship U Space and U Space Plus products transform any surface into a structured creative workspace, with the Horse Combo and New Year Combo bundles offering significant savings on curated sets. Accessories include signature charms (Matcha, Cappuccino, Latte) that add personality to your setup. Prices range from $149–$299 for core products with current promotional pricing. UJUAL targets the growing segment of professionals who treat their physical workspace as an extension of their creative identity — not just a place to put a laptop, but a curated environment that signals intentionality and supports focused work. With 3,483+ verified reviews and a strong community around workspace aesthetics, UJUAL has built a loyal following among the "setup culture" audience on social media.',
  },
]

// Apps needing detailed_description fixed
const fixApps = [
  {
    id: '742a61dc-21c8-44fd-8b3c-b34f2fe999cd',
    name: 'OpenClaw',
    detailed_description: 'OpenClaw is a comprehensive AI agent platform that transforms how you interact with your digital environment. It acts as a personal AI system running on your Mac, connecting to your communication channels (iMessage, WhatsApp, Telegram, Discord), apps, devices, and services through a unified agent architecture. OpenClaw runs as a persistent daemon, enabling proactive assistance — it can monitor your calendar, manage emails, automate workflows, and respond intelligently across multiple platforms simultaneously. The platform supports Skills (installable capability modules), scheduled Cron jobs, and Node connections to paired mobile devices. Built for power users, developers, and professionals who want genuine AI integration rather than isolated chatbot interactions, OpenClaw turns your Mac into an intelligent hub that acts on your behalf across your entire digital life.',
  },
  {
    id: '1053a348-d269-4d7b-a326-e3ebce1beb6c',
    name: 'Figma',
    detailed_description: 'Figma is the industry-standard collaborative design platform used by product designers, UX teams, and developers worldwide. Running entirely in the browser with desktop apps available, Figma enables real-time multiplayer design — multiple team members can work on the same file simultaneously, see each other\'s cursors, and leave comments directly on designs. Its vector editing tools, component system, auto-layout, and prototyping capabilities cover the full product design workflow from wireframes to high-fidelity mockups to interactive prototypes. FigJam, Figma\'s whiteboarding tool, extends collaboration to brainstorming and diagramming. Dev Mode bridges design and engineering by generating CSS, iOS, and Android code directly from designs. Figma\'s plugin ecosystem (thousands of third-party plugins) and Variables system for design tokens make it adaptable to any team\'s workflow. Acquired by Adobe, Figma remains the dominant tool for modern product design teams of all sizes.',
  },
  {
    id: '4d65240b-a6a9-4eec-90b7-dbc3a1fc6774',
    name: 'Supabase',
    detailed_description: 'Supabase is an open-source Firebase alternative that provides a complete backend-as-a-service built on PostgreSQL. Where Firebase uses proprietary NoSQL, Supabase gives you a real relational database with the full power of SQL, combined with a generous free tier and instant APIs. Core offerings include a PostgreSQL database with Row Level Security (RLS), auto-generated REST and GraphQL APIs, real-time subscriptions via WebSockets, authentication with social OAuth providers, edge functions (Deno-based serverless), and file storage. The Supabase dashboard makes database management accessible to developers who aren\'t SQL experts, while still giving full psql access for power users. Supabase has become the default backend choice for indie hackers, startups, and increasingly larger teams who want the flexibility of PostgreSQL without the infrastructure complexity. Its JavaScript, Python, Flutter, and other SDKs make it easy to integrate into any stack.',
  },
  {
    id: '1629e04f-e29b-4989-9ba0-cf8d0fed477b',
    name: 'Obsidian',
    detailed_description: 'Obsidian is a local-first knowledge management and note-taking application that stores all your notes as plain Markdown files on your own device — no cloud lock-in, no proprietary format, your data is always yours. Its killer feature is bidirectional linking: create [[wikilinks]] between notes and Obsidian builds a visual graph showing how your ideas connect. This enables the "second brain" or Zettelkasten method of knowledge management, where ideas accumulate and cross-pollinate over time rather than being siloed in folders. Obsidian\'s plugin ecosystem (1000+ community plugins) extends it with everything from Kanban boards and Dataview queries to daily notes, spaced repetition, and AI integration. The core app is free for personal use; Obsidian Sync and Obsidian Publish are paid add-ons for cross-device sync and web publishing respectively. Beloved by writers, researchers, developers, and knowledge workers, Obsidian has become the gold standard for building a personal knowledge base that grows with you.',
  },
  {
    id: '83b693d3-f535-4c86-981c-584ddf85e1e3',
    name: 'OSWorld',
    detailed_description: 'OSWorld is a research benchmark for evaluating AI agents on real computer tasks involving GUI interaction. Unlike text-only benchmarks, OSWorld puts AI agents in front of actual computer interfaces — browsers, file systems, applications — and measures whether they can complete real tasks the way a human would. Tasks span web browsing, file manipulation, application control, and cross-app workflows, all requiring the agent to perceive screen state and take meaningful actions. OSWorld was developed by academic researchers as a rigorous, reproducible framework for measuring GUI automation progress. It establishes standardized environments and evaluation protocols that make it possible to compare different agent architectures fairly. For AI researchers working on computer use, desktop automation, and agentic systems, OSWorld provides the definitive benchmark. The project is open-source and serves as both a research tool and a forcing function that reveals how far current AI systems are from human-level computer operation.',
  },
  {
    id: 'ac6fac37-9ddc-4a93-9616-7a051c761eaf',
    name: 'NVIDIA Build',
    detailed_description: 'NVIDIA Build is NVIDIA\'s cloud API platform for accessing state-of-the-art AI models across multiple modalities — language, vision, speech, and more — through simple REST APIs. Developers can access models from NVIDIA, Meta, Mistral, Google, and other leading AI labs without managing GPU infrastructure. The platform includes optimized versions of models like Llama, Gemma, Mistral, and NVIDIA\'s own NIM (NVIDIA Inference Microservices) — containerized, optimized model deployments that can run in the cloud or on-premise. NVIDIA Build is particularly valuable for enterprises that need high-performance AI inference at scale, want to benchmark different models against their use cases, or need the assurance of NVIDIA\'s enterprise support and SLAs. The platform also serves as a showcase for what\'s possible on NVIDIA hardware, giving developers early access to cutting-edge models as they\'re released. Free credits are available for exploration, with enterprise tiers for production deployments.',
  },
  {
    id: '8089eb98-5336-47cf-b05f-ebb1efabe9f5',
    name: 'NotebookLM',
    detailed_description: 'NotebookLM is Google\'s AI-powered research and note-taking tool that transforms how you interact with your own documents. Upload PDFs, Google Docs, slides, URLs, or paste text, and NotebookLM creates a personalized AI that answers questions, generates summaries, identifies connections, and synthesizes insights — all grounded in your specific sources, not general internet knowledge. The killer feature is source fidelity: every answer includes inline citations pointing to the exact passage in your documents, so you can verify every claim. NotebookLM also generates Audio Overviews — surprisingly natural AI podcast-style discussions of your documents that you can listen to like a briefing. Use cases range from academic research and literature review to legal document analysis, due diligence, competitive research, and studying. The tool is free to use with a Google account and has attracted millions of users who need to rapidly understand dense document sets. A NotebookLM Plus tier adds higher usage limits and additional features for power users.',
  },
  {
    id: 'ccae5fde-3409-4b89-914b-ed75f5be4bb2',
    name: 'Shannon',
    detailed_description: 'Shannon is an open-source AI knowledge graph framework developed by KeygraphHQ for structured reasoning and persistent memory in AI systems. Named after Claude Shannon, the father of information theory, the framework addresses one of the core limitations of LLMs: their inability to maintain and reason over structured, evolving knowledge between sessions. Shannon provides tools for building knowledge graphs that AI systems can read from, write to, and reason over — enabling the kind of associative, connected thinking that characterizes genuine understanding rather than pattern matching. The framework supports structured entities, relationships, and attributes, with graph traversal and reasoning capabilities that complement LLM generation. Shannon is particularly relevant for developers building AI agents, autonomous systems, or applications that need persistent, queryable memory structures. As the AI field moves from stateless chatbots toward agents with genuine long-term context, frameworks like Shannon provide the architectural foundation for AI systems that actually remember and reason about what they know.',
  },
  {
    id: 'dd36dc33-ec02-4fea-877f-e1cbd49a0cce',
    name: 'CollectorCrypt Bid',
    detailed_description: 'CollectorCrypt Bid is the auction platform arm of CollectorCrypt, designed for competitive bidding on rare physical collectibles using cryptocurrency. The platform targets collectors in the trading card, Pokemon, and rare collectibles space who want the transparency and security of blockchain-based transactions for high-value items. Auction mechanics allow collectors to compete for premium items with the full assurance of crypto payment finality — no chargebacks, no payment processor intermediaries. CollectorCrypt Bid integrates with the broader CollectorCrypt marketplace ecosystem, where items listed for auction can also reach the wider marketplace audience. For sellers of premium graded cards and rare collectibles, the auction format often achieves better prices than fixed listings for truly rare items where demand is uncertain. The platform is positioned at the intersection of the booming collectibles market and the crypto-native user base, serving collectors who are comfortable with both and want the benefits of both worlds.',
  },
  {
    id: 'e7d3b1cb-adc9-4e25-96f4-5c9319f9bc8d',
    name: 'CollectorCrypt',
    detailed_description: 'CollectorCrypt is a crypto-native marketplace for physical collectibles — Pokémon cards, trading cards, rare toys, and other premium collectibles — where transactions are settled in cryptocurrency. It bridges the traditional collectibles market with the crypto ecosystem, targeting collectors who are active in both worlds and want the benefits of crypto payments (speed, finality, global access, no chargebacks) for their hobby purchases. The platform handles the trust mechanics critical to high-value collectible transactions: verified listings, authentication checks, and secure escrow ensure buyers and sellers can transact confidently on valuable items. CollectorCrypt also operates a separate auction platform (CollectorCrypt Bid) for competitive bidding on premier items. As the collectibles market continues to grow and crypto adoption in niche communities deepens, CollectorCrypt fills a real gap: a dedicated venue where crypto users can spend their digital assets on physical items they actually want. The platform serves both casual collectors and serious investors treating premium collectibles as alternative assets.',
  },
  {
    id: '705da2b3-abf8-4beb-80b1-154f7f52d887',
    name: 'Nansen',
    detailed_description: 'Nansen is the premier on-chain analytics platform for crypto investors, researchers, and traders who want to understand what\'s actually happening on-chain rather than relying on price charts alone. Its core value proposition is wallet labeling: Nansen\'s team has manually identified and labeled millions of blockchain wallets — exchanges, funds, whales, smart money, protocols — so you can see exactly who is buying, selling, or holding what. The platform tracks token flows, NFT movements, DeFi position changes, and smart contract interactions in near-real-time. Nansen\'s Smart Money feature shows you which wallets with strong track records are moving into or out of specific assets. Custom dashboards, alerts, and portfolio tracking make it a daily tool for serious crypto participants. Nansen covers Ethereum, Solana, BNB Chain, Polygon, and many other networks. Premium tiers provide deeper data access, custom queries, and institutional-grade analytics. For anyone making significant capital allocation decisions in crypto, Nansen provides the on-chain intelligence layer that fundamentally changes how you assess market dynamics.',
  },
  {
    id: 'e95cc23c-d39e-4f7d-9472-5818a069500d',
    name: 'Visual Studio Code',
    detailed_description: 'Visual Studio Code (VS Code) is the world\'s most popular code editor, built by Microsoft and used by an estimated 73%+ of professional developers. Free, open-source, and available for Windows, macOS, and Linux, VS Code combines the lightweight feel of a text editor with the intelligence of an IDE through its powerful extension ecosystem. Core features include IntelliSense (context-aware code completion), built-in Git integration, an integrated terminal, a debugger for most languages, and live collaboration via Live Share. The VS Code Marketplace offers 50,000+ extensions covering every language, framework, linter, theme, and workflow tool imaginable. Key extensions like GitHub Copilot, Prettier, ESLint, and language-specific packs are installed by millions. VS Code\'s Remote Development extensions let you code inside Docker containers, SSH hosts, or WSL environments seamlessly. Its Monaco editor engine also powers web-based code editors across the industry. Whether you write Python, JavaScript, TypeScript, Rust, Go, or anything else, VS Code is almost certainly the editor your team uses.',
  },
  {
    id: '210a67e3-8d8d-4073-9c83-3af22cca3ebf',
    name: 'Claude Code',
    detailed_description: 'Claude Code is Anthropic\'s agentic coding assistant that lives in your terminal and operates with genuine autonomy over your codebase. Unlike tab-completion copilots or chat interfaces, Claude Code can read files, write code, execute commands, run tests, fix bugs, and iterate across multiple files to complete tasks end-to-end — all from a single natural language prompt. It uses Anthropic\'s extended thinking models to plan before acting, breaking complex engineering tasks into steps and validating its own work as it goes. Claude Code has access to bash, can install packages, manage git, and integrate with your existing dev tools. It\'s designed for the agentic engineering workflow: you describe what needs to happen, Claude Code figures out how to make it happen, and checks in when it needs clarification or encounters ambiguity. For developers working on large codebases, refactoring tasks, debugging sessions, or greenfield projects, Claude Code acts as a capable pair programmer that can take the wheel on well-defined tasks and deliver working results.',
  },
]

async function upsert(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

async function patch(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/apps?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

async function main() {
  console.log(`\n=== INSERTING ${newApps.length} NEW APPS ===\n`)
  let inserted = 0, failed = 0
  for (const app of newApps) {
    const payload = {
      ...app,
      created_at: randomDate(),
      upvotes: 0,
      featured: false,
    }
    const result = await upsert('apps', payload)
    if (result.status === 201) {
      console.log(`  ✅ ${app.name}`)
      inserted++
    } else {
      console.log(`  ❌ ${app.name} — ${result.status}: ${result.body.slice(0,120)}`)
      failed++
    }
    await new Promise(r => setTimeout(r, 80)) // small delay
  }
  console.log(`\nInserted: ${inserted}  Failed: ${failed}`)

  console.log(`\n=== FIXING ${fixApps.length} EXISTING DETAILED DESCRIPTIONS ===\n`)
  let fixed = 0, fixFailed = 0
  for (const app of fixApps) {
    const result = await patch(app.id, { detailed_description: app.detailed_description })
    if (result.status === 200) {
      console.log(`  ✅ Fixed: ${app.name}`)
      fixed++
    } else {
      console.log(`  ❌ ${app.name} — ${result.status}: ${result.body.slice(0,120)}`)
      fixFailed++
    }
    await new Promise(r => setTimeout(r, 80))
  }
  console.log(`\nFixed: ${fixed}  Failed: ${fixFailed}`)
  console.log('\n✅ Done!')
}

main().catch(console.error)
