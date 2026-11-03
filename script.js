    // The practical catalogue powers both the grid and the accessible detail dialog.
    const practicals = [
      { title: "Wired LAN Simulation", domain: "Networking", description: "Build a small wired local area network and trace ping requests through PCs, a switch, a router and a server.", demo: "Follow a glowing packet hop by hop across a simulated campus topology." },
      { title: "IPv4 and IPv6 Addressing", domain: "Networking", description: "Explore subnet masks, network and broadcast addresses, host ranges, and the structure of IPv6.", demo: "Calculate an IPv4 subnet and inspect or compress an IPv6 address." },
      { title: "TCP Three-Way Handshake", domain: "Networking", description: "Understand how SYN, SYN-ACK and ACK establish a reliable client-server connection.", demo: "Advance each handshake step and watch both endpoint states update." },
      { title: "Flow and Error Control", domain: "Networking", description: "Study sliding-window flow control, acknowledgements, timeouts and retransmission.", demo: "Send ten frames in a four-frame window with an optional lost frame." },
      { title: "QUIC Protocol and Checksum", domain: "Networking", description: "Compare connection setup round trips and learn how a 16-bit Internet checksum detects errors.", demo: "Adjust RTT and calculate or verify a one's-complement checksum." },
      { title: "Figma Wireframe Design", domain: "Design", description: "Create low-fidelity mobile wireframes for the Home, Practicals and Register screens.", demo: "Toggle the phone mockups between wireframe and styled designs." },
      { title: "Animated Prototype", domain: "Design", description: "Connect screens into a prototype with smooth, purposeful screen transitions.", demo: "Navigate the sample Smart Campus prototype with its bottom tab bar." },
      { title: "Digital Storytelling", domain: "Design", description: "Communicate an idea as a sequence of short, visual story beats.", demo: "Reveal a four-part story tracing a student's network request." },
      { title: "Student Registration and Validation", domain: "Web & App", description: "Build an accessible registration form with real-time validation and password feedback.", demo: "Try the form with valid and invalid student details." },
      { title: "Flutter Animations", domain: "Web & App", description: "Experiment with AnimatedContainer, AnimatedOpacity, RotationTransition and ScaleTransition.", demo: "Choose an animation and compare its CSS preview with equivalent Dart code." }
    ];
    const grid = document.getElementById("practicalGrid");
    const dialog = document.getElementById("practicalDialog");
    const tagColors = { Networking: "teal", Design: "purple", "Web & App": "orange" };

    function renderPracticals(filter = "All") {
      grid.innerHTML = "";
      practicals.forEach((item, index) => {
        if (filter !== "All" && item.domain !== filter) return;
        const card = document.createElement("button");
        card.type = "button";
        card.className = "practical-card reveal";
        card.setAttribute("aria-label", `Open practical ${index + 1}: ${item.title}`);
        card.innerHTML = `<span class="card-top"><span class="number-badge">${String(index + 1).padStart(2, "0")}</span><span class="tag">${item.domain}</span></span><h3>${item.title}</h3><p>${item.description}</p>`;
        card.addEventListener("click", () => {
          document.getElementById("dialogNumber").textContent = `Practical ${String(index + 1).padStart(2, "0")} · ${item.domain}`;
          document.getElementById("dialogTitle").textContent = item.title;
          document.getElementById("dialogDescription").textContent = `${item.description} ${item.demo}`;
          dialog.showModal();
        });
        grid.append(card);
      });
      observeReveals();
    }

    // Follow the operating system until the learner has saved a preference.
    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    let savedTheme = null;
    try { savedTheme = localStorage.getItem("smart-campus-theme"); } catch (error) { console.warn("Theme preference could not be read.", error); }
    const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    function setTheme(theme, persist) {
      root.dataset.theme = theme;
      themeToggle.textContent = theme === "dark" ? "☀" : "☾";
      themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
      document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#111521" : "#f5f7fb";
      if (persist) { try { localStorage.setItem("smart-campus-theme", theme); } catch (error) { console.warn("Theme preference could not be saved.", error); } }
    }
    setTheme(savedTheme || (systemDark ? "dark" : "light"), false);
    themeToggle.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true));

    document.querySelectorAll(".filters .chip").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".filters .chip").forEach(chip => chip.classList.toggle("active", chip === button));
      renderPracticals(button.dataset.filter);
    }));
    document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    document.getElementById("dialogWorkLink").addEventListener("click", event => { if (event.currentTarget.getAttribute("href") === "#") event.preventDefault(); });

    // All ten tabs match the order of the practical catalogue above.
    const demoTabs = document.getElementById("demoTabs");
    const demoNames = ["Wired LAN", "IPv4 / IPv6", "TCP handshake", "Flow control", "QUIC / checksum", "Figma wireframe", "Animated prototype", "Digital story", "Registration", "Flutter"];
    demoNames.forEach((name, index) => {
      const tab = document.createElement("button");
      tab.className = `tab-btn${index === 0 ? " active" : ""}`;
      tab.type = "button"; tab.setAttribute("role", "tab"); tab.setAttribute("aria-selected", String(index === 0));
      tab.textContent = `${String(index + 1).padStart(2, "0")} ${name}`;
      tab.addEventListener("click", () => {
        document.querySelectorAll("#demoTabs .tab-btn").forEach((item, i) => { item.classList.toggle("active", i === index); item.setAttribute("aria-selected", String(i === index)); });
        document.querySelectorAll("[data-demo-panel]").forEach((panel, i) => { panel.hidden = i !== index; });
      });
      demoTabs.append(tab);
    });

    // Stat values count up only when the row enters the viewport.
    const stats = document.getElementById("stats");
    let statsCounted = false;
    const statsObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !statsCounted) {
        statsCounted = true;
        document.querySelectorAll(".stat-num").forEach(el => {
          const target = Number(el.dataset.count), start = performance.now(), duration = 850;
          function tick(now) { const progress = Math.min((now - start) / duration, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))); if (progress < 1) requestAnimationFrame(tick); }
          requestAnimationFrame(tick);
        });
      }
    }, { threshold: .35 });
    statsObserver.observe(stats);

    // Reveal new cards as well as static sections, with a reduced-motion fallback.
    let revealObserver;
    function observeReveals() {
      if (!("IntersectionObserver" in window)) { document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible")); return; }
      if (!revealObserver) revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); revealObserver.unobserve(entry.target); }
      }), { threshold: .1 });
      document.querySelectorAll(".reveal:not(.visible)").forEach(el => revealObserver.observe(el));
    }
    renderPracticals();
    observeReveals();

    // LAN ping animation traverses each node, then retraces the route for the reply.
    const dot = document.getElementById("routeDot"), pingMessage = document.getElementById("pingMessage");
    let pingTimer;
    function ping(destination) {
      clearTimeout(pingTimer);
      const serverRoute = [{ x: 75, y: 60, name: "PC1" }, { x: 235, y: 110, name: "Switch" }, { x: 412, y: 110, name: "Router" }, { x: 517, y: 110, name: "Server" }];
      const pcRoute = [{ x: 75, y: 60, name: "PC1" }, { x: 235, y: 110, name: "Switch" }, { x: 75, y: 165, name: "PC2" }];
      const route = destination === "server" ? serverRoute : pcRoute;
      const steps = [...route, ...route.slice(0, -1).reverse()];
      dot.classList.add("visible");
      let step = 0;
      const advance = () => {
        const point = steps[step];
        dot.setAttribute("cx", point.x); dot.setAttribute("cy", point.y);
        const isReply = step >= route.length;
        pingMessage.textContent = `${isReply ? "Echo reply" : "Echo request"}: ${point.name} ${isReply ? "responds" : "receives the packet"}.`;
        step += 1;
        if (step < steps.length) pingTimer = setTimeout(advance, 550);
        else pingTimer = setTimeout(() => { pingMessage.textContent = `Ping complete — ${destination === "server" ? "server" : "PC2"} is reachable.`; dot.classList.remove("visible"); }, 550);
      };
      advance();
    }
    document.getElementById("pingServer").addEventListener("click", () => ping("server"));
    document.getElementById("pingPc2").addEventListener("click", () => ping("pc2"));

    // IPv4 arithmetic uses unsigned 32-bit values and handles /0 and /32 boundaries.
    function ipv4ToInt(value) {
      const parts = value.trim().split(".");
      if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
      return parts.reduce((acc, part) => ((acc * 256) + Number(part)) >>> 0, 0);
    }
    function intToIpv4(value) { return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join("."); }
    function calculateSubnet() {
      const address = document.getElementById("ipv4Address").value, prefix = Number(document.getElementById("prefix").value);
      const ip = ipv4ToInt(address), error = document.getElementById("subnetError"), result = document.getElementById("subnetResult");
      if (ip === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) { error.textContent = "Enter a valid IPv4 address and a prefix from 0 to 32."; result.innerHTML = ""; return; }
      error.textContent = "";
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = (ip & mask) >>> 0, broadcast = (network | (~mask >>> 0)) >>> 0;
      const hostBits = 32 - prefix, total = Math.pow(2, hostBits);
      const first = total <= 2 ? network : (network + 1) >>> 0, last = total <= 2 ? broadcast : (broadcast - 1) >>> 0;
      result.innerHTML = `<p>Mask: <strong>${intToIpv4(mask)}</strong></p><p>Network: <strong>${intToIpv4(network)}/${prefix}</strong></p><p>Broadcast: <strong>${intToIpv4(broadcast)}</strong></p><p>First host: <strong>${intToIpv4(first)}</strong></p><p>Last host: <strong>${intToIpv4(last)}</strong></p><p>Usable hosts: <strong>${total <= 2 ? 0 : total - 2}</strong></p>`;
    }
    document.getElementById("calculateSubnet").addEventListener("click", calculateSubnet);
    document.getElementById("ipv4Address").addEventListener("keydown", event => { if (event.key === "Enter") calculateSubnet(); });
    document.getElementById("prefix").addEventListener("keydown", event => { if (event.key === "Enter") calculateSubnet(); });
    calculateSubnet();

    function inspectIpv6() {
      const raw = document.getElementById("ipv6Address").value.trim().toLowerCase();
      const output = document.getElementById("ipv6Result");
      if (!raw || !/^[0-9a-f:]+$/.test(raw) || (raw.match(/::/g) || []).length > 1) { output.textContent = "Enter a valid IPv6 address (hexadecimal groups separated by colons)."; return; }
      let groups = raw.split(":");
      if (raw.includes("::")) {
        const sides = raw.split("::"), left = sides[0] ? sides[0].split(":") : [], right = sides[1] ? sides[1].split(":") : [];
        const missing = 8 - left.length - right.length;
        if (missing < 1) { output.textContent = "This IPv6 address has an invalid number of groups."; return; }
        groups = [...left, ...Array(missing).fill("0"), ...right];
      }
      if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) { output.textContent = "Enter a valid IPv6 address with eight groups (or a valid :: abbreviation)."; return; }
      const expanded = groups.map(group => group.padStart(4, "0")).join(":");
      const normalized = groups.map(group => parseInt(group, 16).toString(16));
      let bestStart = -1, bestLength = 1;
      for (let i = 0; i < 8;) {
        if (normalized[i] !== "0") { i++; continue; }
        let j = i; while (j < 8 && normalized[j] === "0") j++;
        if (j - i > bestLength) { bestStart = i; bestLength = j - i; }
        i = j;
      }
      let compressed;
      if (bestStart < 0) compressed = normalized.join(":");
      else {
        const before = normalized.slice(0, bestStart).join(":"), after = normalized.slice(bestStart + bestLength).join(":");
        compressed = `${before}::${after}`;
      }
      let type = "global unicast";
      if (normalized.every(group => group === "0")) type = "unspecified";
      else if (normalized.slice(0, 7).every(group => group === "0") && normalized[7] === "1") type = "loopback";
      else if (normalized[0] === "fe80" || (parseInt(normalized[0], 16) & 0xffc0) === 0xfe80) type = "link-local";
      else if ((parseInt(normalized[0], 16) & 0xff00) === 0xff00) type = "multicast";
      else if (normalized[0] === "2001" && normalized[1] === "db8") type = "documentation";
      else if ((parseInt(normalized[0], 16) & 0xfe00) === 0xfc00) type = "unique local";
      output.innerHTML = `Compressed: <strong>${compressed}</strong><br>Expanded: <strong>${expanded}</strong><br>Address type: <strong>${type}</strong>`;
    }
    document.getElementById("inspectIpv6").addEventListener("click", inspectIpv6);

    let handshakeStep = 0;
    function resetHandshake() {
      handshakeStep = 0;
      ["synArrow", "synAckArrow", "ackArrow"].forEach(id => document.getElementById(id).classList.remove("show"));
      document.getElementById("clientState").textContent = "CLOSED"; document.getElementById("serverState").textContent = "LISTEN";
      document.getElementById("handshakeMessage").textContent = "Ready to connect.";
    }
    document.getElementById("nextHandshake").addEventListener("click", () => {
      const client = document.getElementById("clientState"), server = document.getElementById("serverState"), message = document.getElementById("handshakeMessage");
      if (handshakeStep === 0) { document.getElementById("synArrow").classList.add("show"); client.textContent = "SYN-SENT"; server.textContent = "SYN-RECEIVED"; message.textContent = "Client sends SYN with its initial sequence number."; }
      else if (handshakeStep === 1) { document.getElementById("synAckArrow").classList.add("show"); client.textContent = "SYN-SENT"; server.textContent = "SYN-RECEIVED"; message.textContent = "Server acknowledges the SYN and sends its own SYN."; }
      else if (handshakeStep === 2) { document.getElementById("ackArrow").classList.add("show"); client.textContent = "ESTABLISHED"; server.textContent = "ESTABLISHED"; message.textContent = "Client acknowledges. The connection is established."; }
      else { message.textContent = "Connection established. Reset to run it again."; return; }
      handshakeStep++;
    });
    document.getElementById("resetHandshake").addEventListener("click", resetHandshake);

    const frameList = document.getElementById("frameList"), windowIndicator = document.getElementById("windowIndicator");
    function resetFrames() {
      frameList.innerHTML = "";
      for (let i = 1; i <= 10; i++) { const frame = document.createElement("div"); frame.className = "frame"; frame.textContent = i; frame.id = `frame-${i}`; frameList.append(frame); }
      windowIndicator.style.left = "0";
      document.getElementById("frameMessage").textContent = "Window size: 4 · Ready to send frames 1–4.";
      document.getElementById("startFrames").disabled = false;
    }
    let frameRun = 0;
    function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    async function runFrames() {
      const run = ++frameRun, loseFive = document.getElementById("loseFrame").checked;
      document.getElementById("startFrames").disabled = true;
      const status = document.getElementById("frameMessage");
      for (let start = 1; start <= 10; start += 4) {
        windowIndicator.style.left = `${(start - 1) * 10}%`;
        const end = Math.min(start + 3, 10);
        for (let i = start; i <= end; i++) { if (run !== frameRun) return; document.getElementById(`frame-${i}`).classList.add("sent"); status.textContent = `Sending frame ${i}…`; await wait(300); }
        if (loseFive && start <= 5 && end >= 5) {
          document.getElementById("frame-5").classList.add("lost"); status.textContent = "Frame 5 lost — waiting for timeout…"; await wait(850);
          if (run !== frameRun) return;
          document.getElementById("frame-5").classList.remove("lost"); document.getElementById("frame-5").classList.add("sent"); status.textContent = "Timeout: retransmitting frame 5…"; await wait(500);
        }
        for (let i = start; i <= end; i++) { if (run !== frameRun) return; document.getElementById(`frame-${i}`).classList.remove("sent"); document.getElementById(`frame-${i}`).classList.add("acked"); }
        status.textContent = `ACK received for frames ${start}–${end}.`;
        await wait(350);
      }
      if (run === frameRun) { status.textContent = "All 10 frames acknowledged."; document.getElementById("startFrames").disabled = false; }
    }
    document.getElementById("startFrames").addEventListener("click", runFrames);
    document.getElementById("resetFrames").addEventListener("click", () => { frameRun++; resetFrames(); });
    resetFrames();

    const rttSlider = document.getElementById("rttSlider");
    function updateRtt() {
      const rtt = Number(rttSlider.value);
      document.getElementById("rttValue").textContent = `${rtt} ms`;
      document.getElementById("rttMessage").textContent = `Approximate setup delay: ${rtt * 2} ms vs ${rtt} ms vs 0 ms.`;
      document.getElementById("tcpBar").style.setProperty("--bar-width", "100%");
      document.getElementById("quicBar").style.setProperty("--bar-width", "50%");
      document.getElementById("zeroBar").style.setProperty("--bar-width", "8%");
      requestAnimationFrame(() => document.querySelectorAll(".comparison .bar").forEach(bar => bar.classList.add("run")));
    }
    rttSlider.addEventListener("input", updateRtt); updateRtt();
    function checksum(words) {
      let sum = 0;
      words.forEach(word => { sum += word; sum = (sum & 0xffff) + (sum >>> 16); });
      while (sum >>> 16) sum = (sum & 0xffff) + (sum >>> 16);
      return (~sum) & 0xffff;
    }
    function getWords() {
      const tokens = document.getElementById("checksumInput").value.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length || tokens.some(token => !/^[0-9a-f]{1,4}$/i.test(token))) return null;
      return tokens.map(token => parseInt(token, 16));
    }
    document.getElementById("calculateChecksum").addEventListener("click", () => {
      const words = getWords(), output = document.getElementById("checksumResult");
      if (!words) { output.textContent = "Enter one or more valid 16-bit hexadecimal words."; return; }
      output.innerHTML = `Checksum: <strong>0x${checksum(words).toString(16).padStart(4, "0").toUpperCase()}</strong>`;
    });
    document.getElementById("verifyChecksum").addEventListener("click", () => {
      const words = getWords(), received = document.getElementById("receivedChecksum").value.trim();
      const output = document.getElementById("checksumVerifyResult");
      if (!words || !/^[0-9a-f]{1,4}$/i.test(received)) { output.textContent = "Enter valid data words and a 16-bit hex checksum."; return; }
      const sum = checksum(words), receivedValue = parseInt(received, 16);
      output.textContent = sum === receivedValue ? "Checksum matches — data appears intact." : `Checksum mismatch — expected 0x${sum.toString(16).padStart(4, "0").toUpperCase()}.`;
      output.style.color = sum === receivedValue ? "var(--green)" : "var(--red)";
    });

    // Form rules are deliberately explicit so the feedback stays useful as the user types.
    const validators = {
      studentName: value => value.trim().length >= 2 ? "" : "Enter at least 2 characters.",
      studentEmail: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Enter a valid email address.",
      studentMobile: value => /^[6-9]\d{9}$/.test(value.trim()) ? "" : "Use 10 digits, starting with 6, 7, 8 or 9.",
      studentPassword: value => value.length >= 8 ? "" : "Use at least 8 characters."
    };
    const errorIds = { studentName: "nameError", studentEmail: "emailError", studentMobile: "mobileError", studentPassword: "passwordError" };
    function validateField(input, showEmpty = false) {
      const error = validators[input.id](input.value);
      input.classList.toggle("valid", !error && input.value.length > 0);
      input.classList.toggle("invalid", Boolean(error) && (input.value.length > 0 || showEmpty));
      document.getElementById(errorIds[input.id]).textContent = (input.value.length > 0 || showEmpty) ? error : "";
      return !error;
    }
    Object.keys(validators).forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener("input", () => {
        validateField(input);
        if (id === "studentPassword") {
          const value = input.value;
          let score = 0;
          if (value.length >= 8) score++;
          if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
          if (/\d/.test(value)) score++;
          if (/[^A-Za-z0-9]/.test(value)) score++;
          const fill = document.getElementById("strengthFill");
          fill.style.width = `${score * 25}%`;
          fill.style.background = score < 2 ? "var(--red)" : score < 4 ? "#e6a23c" : "var(--green)";
        }
        document.getElementById("registrationSuccess").textContent = "";
      });
    });
    document.getElementById("registrationForm").addEventListener("submit", event => {
      event.preventDefault();
      const valid = Object.keys(validators).map(id => validateField(document.getElementById(id), true)).every(Boolean);
      document.getElementById("registrationSuccess").textContent = valid ? "Registration details look good — profile ready!" : "";
    });

    document.getElementById("wireframeToggle").addEventListener("click", event => {
      const phones = document.querySelectorAll(".styled-phone");
      const wireframe = !phones[0].classList.contains("wireframe");
      phones.forEach(phone => phone.classList.toggle("wireframe", wireframe));
      event.currentTarget.textContent = wireframe ? "Switch to styled design" : "Switch to wireframe";
      event.currentTarget.setAttribute("aria-pressed", String(wireframe));
      event.currentTarget.classList.toggle("active", wireframe);
    });
    document.querySelectorAll(".prototype-tabs button").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.proto);
      document.getElementById("prototypeTrack").style.transform = `translateX(-${index * 33.333}%)`;
      document.querySelectorAll(".prototype-tabs button").forEach(tab => tab.classList.toggle("active", tab === button));
    }));

    const story = [
      ["A student clicks “submit” in the computer lab.", "Every journey starts with a request."],
      ["The packet travels through a switch, then finds its route.", "Local links and routers work together."],
      ["The server checks the request and prepares a response.", "Reliable connections keep the exchange in order."],
      ["A reply reaches the student — the result appears on screen.", "One tiny packet, a whole campus connected."]
    ];
    let storyIndex = 0;
    function showStory() {
      document.getElementById("storyCounter").textContent = `Beat ${storyIndex + 1} of ${story.length}`;
      document.getElementById("storyBeat").textContent = story[storyIndex][0];
      document.getElementById("storyHint").textContent = story[storyIndex][1];
      document.getElementById("storyProgress").style.width = `${((storyIndex + 1) / story.length) * 100}%`;
      document.getElementById("nextStory").textContent = storyIndex === story.length - 1 ? "Start again ↻" : "Next beat →";
    }
    document.getElementById("nextStory").addEventListener("click", () => { storyIndex = (storyIndex + 1) % story.length; showStory(); });
    showStory();

    const dartSnippets = {
      container: `AnimatedContainer(\n  duration: const Duration(milliseconds: 550),\n  curve: Curves.easeInOut,\n  width: expanded ? 190 : 150,\n  height: expanded ? 110 : 150,\n  decoration: BoxDecoration(\n    color: Colors.teal,\n    borderRadius: BorderRadius.circular(\n      expanded ? 44 : 24,\n    ),\n  ),\n)`,
      opacity: `AnimatedOpacity(\n  opacity: visible ? 1.0 : 0.2,\n  duration: const Duration(milliseconds: 550),\n  child: const CampusBadge(),\n)`,
      rotate: `RotationTransition(\n  turns: animation,\n  child: const Icon(\n    Icons.auto_awesome,\n    color: Colors.white,\n  ),\n)`,
      scale: `ScaleTransition(\n  scale: animation,\n  child: const CampusBadge(),\n)`
    };
    function playFlutterAnimation(type) {
      const box = document.getElementById("flutterBox");
      box.classList.remove("container", "opacity", "rotate", "scale");
      void box.offsetWidth;
      box.classList.add(type);
      document.getElementById("dartCode").textContent = dartSnippets[type];
      document.querySelectorAll("[data-animation]").forEach(chip => chip.classList.toggle("active", chip.dataset.animation === type));
    }
    document.querySelectorAll("[data-animation]").forEach(button => button.addEventListener("click", () => playFlutterAnimation(button.dataset.animation)));
    document.getElementById("flutterBox").addEventListener("click", () => {
      const active = document.querySelector("[data-animation].active").dataset.animation;
      playFlutterAnimation(active);
    });
    document.getElementById("flutterBox").addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); document.getElementById("flutterBox").click(); } });
  
