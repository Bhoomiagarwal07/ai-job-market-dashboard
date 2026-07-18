import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RISERS = ["LangChain", "RAG Pipelines", "Agentic AI / LangGraph", "Vector Databases"];
const YOUR_SKILLS_DEFAULT = ["Python", "SQL", "Feature Engineering"];

const COLORS = {
  amber: "#E8A33D", teal: "#4FB8A6", rust: "#C4644B", grid: "#2A2F3A",
  text: "#EDEAE3", muted: "#8A8F98", card: "#1C2029", bg: "#14171C",
};

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontFamily: "ui-monospace, 'SF Mono', monospace",
        letterSpacing: 0.3, border: `1px solid ${active ? COLORS.amber : COLORS.grid}`,
        background: active ? "rgba(232,163,61,0.12)" : "transparent",
        color: active ? COLORS.amber : COLORS.muted, cursor: "pointer", transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [role, setRole] = useState("All");
  const [level, setLevel] = useState("All");
  const [city, setCity] = useState("All");
  const [yourSkills, setYourSkills] = useState(YOUR_SKILLS_DEFAULT);
  const [targetRole, setTargetRole] = useState("AI Engineer");

  useEffect(() => {
    fetch("/data.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data.json (${r.status})`);
        return r.json();
      })
      .then((json) => setRawData(json))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const ROLES = useMemo(() => [...new Set(rawData.map((d) => d.role))].sort(), [rawData]);
  const LEVELS = useMemo(() => [...new Set(rawData.map((d) => d.level))].sort(), [rawData]);
  const CITIES = useMemo(() => [...new Set(rawData.map((d) => d.city))].sort(), [rawData]);
  const ALL_SKILLS = useMemo(() => [...new Set(rawData.flatMap((d) => d.skills))].sort(), [rawData]);

  const filtered = useMemo(() => rawData.filter((d) =>
    (role === "All" || d.role === role) &&
    (level === "All" || d.level === level) &&
    (city === "All" || d.city === city)
  ), [rawData, role, level, city]);

  const skillFreq = useMemo(() => {
    const map = {};
    filtered.forEach((d) => d.skills.forEach((s) => { map[s] = (map[s] || 0) + 1; }));
    return Object.entries(map)
      .map(([name, count]) => ({ name, pct: Math.round((count / (filtered.length || 1)) * 1000) / 10 }))
      .sort((a, b) => b.pct - a.pct).slice(0, 10);
  }, [filtered]);

  const salaryByLevel = useMemo(() => LEVELS.map((lvl) => {
    const rows = filtered.filter((d) => d.level === lvl);
    const avg = rows.length ? rows.reduce((a, b) => a + b.salary, 0) / rows.length : 0;
    return { level: lvl, avgLPA: Math.round(avg * 10) / 10, count: rows.length };
  }), [filtered, LEVELS]);

  const trendData = useMemo(() => {
    const monthsPresent = [...new Set(rawData.map((d) => d.month))].sort((a, b) => a - b);
    return monthsPresent.map((m) => {
      const rows = rawData.filter((d) => d.month === m && (role === "All" || d.role === role));
      const entry = { month: MONTHS[m - 1] || m };
      RISERS.forEach((skill) => {
        const count = rows.filter((r) => r.skills.includes(skill)).length;
        entry[skill] = rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0;
      });
      return entry;
    });
  }, [rawData, role]);

  const cityStats = useMemo(() => CITIES.map((c) => {
    const rows = rawData.filter((d) => d.city === c && (role === "All" || d.role === role));
    const avg = rows.length ? rows.reduce((a, b) => a + b.salary, 0) / rows.length : 0;
    return { city: c, avgLPA: Math.round(avg * 10) / 10, postings: rows.length };
  }).sort((a, b) => b.avgLPA - a.avgLPA), [rawData, role, CITIES]);

  const kpi = useMemo(() => {
    const avg = filtered.length ? filtered.reduce((a, b) => a + b.salary, 0) / filtered.length : 0;
    const top = skillFreq[0];
    return { count: filtered.length, avg: Math.round(avg * 10) / 10, topSkill: top ? top.name : "—" };
  }, [filtered, skillFreq]);

  const gapAnalysis = useMemo(() => {
    const rows = rawData.filter((d) => d.role === targetRole);
    const freq = {};
    rows.forEach((d) => d.skills.forEach((s) => { freq[s] = (freq[s] || 0) + 1; }));
    const ranked = Object.entries(freq).map(([name, c]) => ({ name, pct: rows.length ? Math.round((c / rows.length) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct).slice(0, 8);
    const have = ranked.filter((r) => yourSkills.includes(r.name));
    const missing = ranked.filter((r) => !yourSkills.includes(r.name));
    const matchPct = ranked.length ? Math.round((have.length / ranked.length) * 100) : 0;
    return { ranked, matchPct, missing };
  }, [rawData, targetRole, yourSkills]);

  const toggleSkill = (s) => setYourSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const cardStyle = { background: COLORS.card, border: `1px solid ${COLORS.grid}`, borderRadius: 10, padding: 20 };
  const labelStyle = { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: COLORS.muted, fontFamily: "ui-monospace, 'SF Mono', monospace", marginBottom: 10 };

  if (loading) {
    return <div style={{ background: COLORS.bg, color: COLORS.muted, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-monospace, monospace" }}>Loading data.json…</div>;
  }
  if (error || rawData.length === 0) {
    return (
      <div style={{ background: COLORS.bg, color: COLORS.text, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui", padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 15, marginBottom: 8 }}>Couldn't load dashboard/public/data.json</div>
        <div style={{ fontSize: 13, color: COLORS.muted, maxWidth: 420 }}>
          {error || "The file is empty."} Run the pipeline first: <code>python fetch_jobs.py && python clean_data.py && python build_dataset.py</code> from the <code>pipeline/</code> folder.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", padding: "28px 22px" }}>
      <div style={{ marginBottom: 22, borderBottom: `1px solid ${COLORS.grid}`, paddingBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.amber, fontFamily: "ui-monospace, monospace", marginBottom: 6 }}>
          MARKET SIGNAL · INDIA
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>AI Engineer Job Market Dashboard</h1>
        <p style={{ color: COLORS.muted, fontSize: 13.5, marginTop: 6, maxWidth: 640 }}>
          Live skill demand, salary bands, and city trends — built from {rawData.length} real postings fetched via the Adzuna API.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {["All", ...ROLES].map((r) => <Pill key={r} active={role === r} onClick={() => setRole(r)}>{r}</Pill>)}
        <div style={{ width: 1, background: COLORS.grid, margin: "0 4px" }} />
        {["All", ...LEVELS].map((l) => <Pill key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Pill>)}
        <div style={{ width: 1, background: COLORS.grid, margin: "0 4px" }} />
        {["All", ...CITIES].map((c) => <Pill key={c} active={city === c} onClick={() => setCity(c)}>{c}</Pill>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Postings matched", value: kpi.count },
          { label: "Avg salary (LPA)", value: `₹${kpi.avg}L` },
          { label: "Top skill", value: kpi.topSkill },
        ].map((k) => (
          <div key={k.label} style={cardStyle}>
            <div style={labelStyle}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Top skills in demand</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={skillFreq} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: COLORS.text, fontSize: 11.5 }} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.grid}`, fontSize: 12 }} formatter={(v) => [`${v}%`, "of postings"]} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {skillFreq.map((_, i) => <Cell key={i} fill={i < 3 ? COLORS.amber : COLORS.teal} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Avg salary by experience level</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salaryByLevel}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="level" tick={{ fill: COLORS.muted, fontSize: 11.5 }} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} unit="L" />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.grid}`, fontSize: 12 }} formatter={(v) => [`₹${v}L`, "avg salary"]} />
              <Bar dataKey="avgLPA" radius={[4, 4, 0, 0]} fill={COLORS.rust} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>GenAI skill momentum (by month)</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trendData}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11.5 }} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.grid}`, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="LangChain" stroke={COLORS.amber} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="RAG Pipelines" stroke={COLORS.teal} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Agentic AI / LangGraph" stroke={COLORS.rust} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Vector Databases" stroke="#8A8F98" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Avg salary by city</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={cityStats} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11 }} unit="L" />
              <YAxis type="category" dataKey="city" width={80} tick={{ fill: COLORS.text, fontSize: 11.5 }} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.grid}`, fontSize: 12 }} formatter={(v) => [`₹${v}L`, "avg salary"]} />
              <Bar dataKey="avgLPA" radius={[0, 4, 4, 0]} fill={COLORS.teal} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={labelStyle}>Your skill gap checker</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: COLORS.muted, marginRight: 4, alignSelf: "center" }}>Target role:</span>
          {ROLES.map((r) => <Pill key={r} active={targetRole === r} onClick={() => setTargetRole(r)}>{r}</Pill>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>Tap the skills you already know:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ALL_SKILLS.map((s) => (
                <Pill key={s} active={yourSkills.includes(s)} onClick={() => toggleSkill(s)}>{s}</Pill>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: gapAnalysis.matchPct >= 60 ? COLORS.teal : COLORS.amber }}>
                {gapAnalysis.matchPct}%
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.muted }}>match to top {targetRole} skills</div>
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Highest-value skills to learn next:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {gapAnalysis.missing.slice(0, 4).map((m) => (
                <div key={m.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 10px", background: "rgba(232,163,61,0.06)", borderRadius: 6, border: `1px solid ${COLORS.grid}` }}>
                  <span>{m.name}</span>
                  <span style={{ color: COLORS.amber, fontFamily: "ui-monospace, monospace" }}>{m.pct}% of postings</span>
                </div>
              ))}
              {gapAnalysis.missing.length === 0 && <div style={{ fontSize: 13, color: COLORS.teal }}>You're covering every top-8 skill for this role. 🎯</div>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: COLORS.muted, borderTop: `1px solid ${COLORS.grid}`, paddingTop: 14, lineHeight: 1.6 }}>
        Data source: Adzuna Jobs API (India), fetched and processed by the pipeline in <code>/pipeline</code>. Re-run <code>build_dataset.py</code> any time to refresh.
      </div>
    </div>
  );
}
