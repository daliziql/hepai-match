"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = {
  gender: "男" | "女";
  age: number;
  city: string;
  height: number;
  appearance: number;
  education: number;
  income: number;
  savings: number;
  career: number;
  personality: number;
  family: number;
  lifestyle: number;
};

type WeightItem = { key: keyof Profile; label: string; weight: number; enabled: boolean };

const seedProfile: Profile = {
  gender: "男",
  age: 29,
  city: "新一线",
  height: 178,
  appearance: 7,
  education: 4,
  income: 28,
  savings: 45,
  career: 7,
  personality: 8,
  family: 7,
  lifestyle: 8,
};

const seedTarget: Profile = {
  gender: "女",
  age: 27,
  city: "新一线",
  height: 165,
  appearance: 8,
  education: 4,
  income: 18,
  savings: 25,
  career: 7,
  personality: 8,
  family: 7,
  lifestyle: 8,
};

const seedWeights: WeightItem[] = [
  { key: "appearance", label: "外在与仪表", weight: 16, enabled: true },
  { key: "income", label: "收入水平", weight: 14, enabled: true },
  { key: "personality", label: "性格与关系能力", weight: 16, enabled: true },
  { key: "age", label: "年龄适配", weight: 10, enabled: true },
  { key: "education", label: "教育背景", weight: 9, enabled: true },
  { key: "height", label: "身高体态", weight: 7, enabled: true },
  { key: "savings", label: "储蓄与资产", weight: 8, enabled: true },
  { key: "career", label: "职业发展", weight: 8, enabled: true },
  { key: "family", label: "家庭支持与负担", weight: 6, enabled: true },
  { key: "lifestyle", label: "生活方式", weight: 6, enabled: true },
];

const educationLabels = ["高中及以下", "大专", "普通本科", "重点本科", "硕士", "博士"];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function metricScore(key: keyof Profile, profile: Profile) {
  const v = profile[key];
  if (typeof v !== "number") return 50;
  switch (key) {
    case "age": {
      const ideal = profile.gender === "男" ? 30 : 27;
      return clamp(100 - Math.abs(profile.age - ideal) * (profile.age > ideal ? 4.2 : 2.4));
    }
    case "height": {
      const mean = profile.gender === "男" ? 169.7 : 158;
      const high = profile.gender === "男" ? 184 : 173;
      return clamp(45 + ((profile.height - mean) / (high - mean)) * 45);
    }
    case "appearance": return clamp(profile.appearance * 10);
    case "education": return [35, 50, 66, 78, 89, 96][profile.education] ?? 50;
    case "income": return clamp(26 + Math.log1p(profile.income / 5) * 29);
    case "savings": return clamp(25 + Math.log1p(profile.savings / 8) * 24);
    case "career":
    case "personality":
    case "family":
    case "lifestyle": return clamp(v * 10);
    default: return 50;
  }
}

function calculate(profile: Profile, weights: WeightItem[]) {
  const active = weights.filter((item) => item.enabled);
  const totalWeight = active.reduce((sum, item) => sum + item.weight, 0) || 1;
  const dimensions = active.map((item) => ({
    ...item,
    score: Math.round(metricScore(item.key, profile)),
  }));
  const raw = dimensions.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
  const score = Math.round(clamp(raw));
  const percentile = Math.round(clamp(50 + (score - 62) * 2.15, 3, 98));
  return { score, percentile, dimensions };
}

function NumberInput({ label, value, onChange, unit, min = 0, max = 999 }: { label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="number-wrap">
        <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}

function RangeInput({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="range-field">
      <span><b>{label}</b><small>{hint}</small></span>
      <input type="range" min="1" max="10" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <strong>{value}.0</strong>
    </label>
  );
}

function ProfileForm({ profile, onChange, compact = false }: { profile: Profile; onChange: (p: Profile) => void; compact?: boolean }) {
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value });
  return (
    <div className={compact ? "profile-form compact" : "profile-form"}>
      <div className="form-grid basics">
        <label className="field"><span>性别</span><select value={profile.gender} onChange={(e) => update("gender", e.target.value as Profile["gender"])}><option>男</option><option>女</option></select></label>
        <NumberInput label="年龄" value={profile.age} min={18} max={65} onChange={(v) => update("age", v)} unit="岁" />
        <label className="field"><span>常住城市</span><select value={profile.city} onChange={(e) => update("city", e.target.value)}><option>一线</option><option>新一线</option><option>二线</option><option>三线及以下</option></select></label>
        <NumberInput label="身高" value={profile.height} min={140} max={210} onChange={(v) => update("height", v)} unit="cm" />
        <label className="field"><span>最高学历</span><select value={profile.education} onChange={(e) => update("education", Number(e.target.value))}>{educationLabels.map((item, i) => <option value={i} key={item}>{item}</option>)}</select></label>
        <NumberInput label="税前年收入" value={profile.income} onChange={(v) => update("income", v)} unit="万元" />
        <NumberInput label="可支配储蓄" value={profile.savings} onChange={(v) => update("savings", v)} unit="万元" />
      </div>
      <div className="divider"><span>软性条件 · 使用结构化自评</span></div>
      <div className="ranges">
        <RangeInput label="外在与仪表" value={profile.appearance} onChange={(v) => update("appearance", v)} hint="整洁、体态、审美" />
        <RangeInput label="职业发展" value={profile.career} onChange={(v) => update("career", v)} hint="稳定性与成长性" />
        <RangeInput label="关系能力" value={profile.personality} onChange={(v) => update("personality", v)} hint="沟通、情绪、责任感" />
        <RangeInput label="家庭支持" value={profile.family} onChange={(v) => update("family", v)} hint="氛围、负担、边界" />
        <RangeInput label="生活方式" value={profile.lifestyle} onChange={(v) => update("lifestyle", v)} hint="健康、家务、消费观" />
      </div>
    </div>
  );
}

function ScorePanel({ profile, weights, title = "你的条件位于" }: { profile: Profile; weights: WeightItem[]; title?: string }) {
  const result = useMemo(() => calculate(profile, weights), [profile, weights]);
  const sorted = [...result.dimensions].sort((a, b) => b.score - a.score);
  return (
    <aside className="score-panel">
      <div className="score-kicker">MATCH INDEX · V0.1</div>
      <div className="score-ring" style={{ "--score": `${result.score * 3.6}deg` } as React.CSSProperties}>
        <div><strong>{result.score}</strong><span>/ 100</span></div>
      </div>
      <h3>{title} <mark>前 {100 - result.percentile}%</mark></h3>
      <p>高于同口径人群的 <b>{result.percentile}%</b>，属于“{result.percentile > 85 ? "稀缺优势" : result.percentile > 68 ? "稳健优势" : "均衡发展"}”区间。</p>
      <div className="percentile-track"><i style={{ left: `${result.percentile}%` }} /><span>普通</span><span>良好</span><span>优秀</span><span>稀缺</span></div>
      <div className="metric-list">
        {sorted.slice(0, 6).map((item) => <div key={item.key}><span>{item.label}</span><i><b style={{ width: `${item.score}%` }} /></i><strong>{item.score}</strong></div>)}
      </div>
      <div className="insight"><span>↗</span><p><b>最显著优势</b>{sorted[0]?.label}超过当前画像的其他维度，是综合分的主要贡献项。</p></div>
    </aside>
  );
}

export default function Home() {
  const [page, setPage] = useState<"score" | "match" | "admin">("score");
  const [matchMode, setMatchMode] = useState<"inspect" | "recommend" | "custom">("inspect");
  const [profile, setProfile] = useState(seedProfile);
  const [target, setTarget] = useState(seedTarget);
  const [weights, setWeights] = useState(seedWeights);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("hepan-config");
    if (stored) {
      try { setWeights(JSON.parse(stored)); } catch { /* ignore invalid local seed */ }
    }
  }, []);

  const own = calculate(profile, weights);
  const desired = calculate(target, weights);
  const compatibility = clamp(Math.round(88 - Math.abs(own.score - desired.score) * 1.55 - Math.max(0, desired.score - own.score) * 0.8), 18, 94);

  const saveWeights = () => {
    localStorage.setItem("hepan-config", JSON.stringify(weights));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setPage("score")}><span>合</span><div><b>合盘</b><small>条件评估与匹配实验室</small></div></button>
        <nav aria-label="主导航">
          <button className={page === "score" ? "active" : ""} onClick={() => setPage("score")}>个人评分</button>
          <button className={page === "match" ? "active" : ""} onClick={() => setPage("match")}>目标匹配</button>
          <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>模型配置</button>
        </nav>
        <div className="header-note"><i /> 本地隐私模式</div>
      </header>

      {page === "score" && (
        <section className="workspace">
          <div className="content-column">
            <div className="eyebrow">PERSONAL BASELINE / 个人基线</div>
            <h1>不是给人定价，<br /><em>是看清自己的坐标。</em></h1>
            <p className="lead">用统一统计口径建立个人条件基线。结果反映的是特定婚恋市场中的相对位置，不代表人的价值。</p>
            <div className="scope-row"><span>当前比较口径</span><button>{profile.gender} · 25–34 岁</button><button>{profile.city}城市</button><button>未婚人群</button></div>
            <ProfileForm profile={profile} onChange={setProfile} />
            <div className="method-note"><b>口径说明</b><p>硬性条件使用公开统计数据映射百分位；软性条件使用结构化自评。相貌、性格等主观项在有他评数据前会降低置信度。</p></div>
          </div>
          <ScorePanel profile={profile} weights={weights} />
        </section>
      )}

      {page === "match" && (
        <section className="match-page">
          <div className="match-heading"><div><div className="eyebrow">TARGET MATCHING / 目标匹配</div><h1>你在找怎样的<em>另一半？</em></h1></div><p>评估目标稀缺度，或根据你的坐标寻找更现实的平衡点。</p></div>
          <div className="mode-tabs">
            <button className={matchMode === "inspect" ? "active" : ""} onClick={() => setMatchMode("inspect")}><b>01</b><span>只看目标<small>无需个人档案</small></span></button>
            <button className={matchMode === "recommend" ? "active" : ""} onClick={() => setMatchMode("recommend")}><b>02</b><span>智能推荐<small>根据我的评分</small></span></button>
            <button className={matchMode === "custom" ? "active" : ""} onClick={() => setMatchMode("custom")}><b>03</b><span>完全定制<small>逐项设置要求</small></span></button>
          </div>

          {matchMode === "recommend" ? (
            <div className="recommend-grid">
              <div className="recommend-hero"><span>基于你的 {own.score} 分</span><h2>建议目标区间<br /><strong>{Math.max(45, own.score - 7)}—{Math.min(95, own.score + 5)}</strong> 分</h2><p>这是条件层面的双向接受估计，不是恋爱成功率。你可以选择更舒适或更有挑战的区间。</p></div>
              {[{name:"舒适区",range:`${own.score-9}—${own.score-3}`,rate:84},{name:"均衡区",range:`${own.score-3}—${own.score+4}`,rate:71},{name:"挑战区",range:`${own.score+4}—${own.score+10}`,rate:46}].map((card, i) => <button className="range-card" key={card.name}><small>0{i+1}</small><h3>{card.name}</h3><strong>{card.range}</strong><div><i style={{width:`${card.rate}%`}} /></div><p>双向接受度估计 {card.rate}%</p></button>)}
              <div className="balance-card"><div><span>条件平衡器</span><h3>锁定偏好，其余条件自动补偿</h3></div><label>目标身高 <b>{target.height} cm</b><input type="range" min="150" max="190" value={target.height} onChange={(e)=>setTarget({...target,height:Number(e.target.value)})}/></label><label>目标年收入 <b>{target.income} 万</b><input type="range" min="3" max="100" value={target.income} onChange={(e)=>setTarget({...target,income:Number(e.target.value)})}/></label><p>当前组合为 <b>{desired.score} 分</b>。若保持目标总分不变，建议将学历要求放宽一级，或将储蓄要求调整至 {Math.max(5,target.savings-8)} 万。</p></div>
            </div>
          ) : (
            <div className="target-workspace">
              <div className="target-form-card">
                <div className="card-title"><span>{matchMode === "inspect" ? "目标画像" : "我的理想型"}</span><small>{matchMode === "inspect" ? "输入对方信息，查看市场位置" : "每多一个硬条件，候选池都会收窄"}</small></div>
                <ProfileForm profile={target} onChange={setTarget} compact />
              </div>
              <ScorePanel profile={target} weights={weights} title={matchMode === "inspect" ? "该目标位于" : "理想型位于"} />
              {matchMode === "custom" && <div className="compat-strip"><div><small>与你的条件匹配指数</small><strong>{compatibility}<i>/100</i></strong></div><p>目标比你高 {Math.max(0, desired.score-own.score)} 分；同时满足当前全部条件的人群约占 <b>{Math.max(1, Math.round((100-desired.percentile)*0.37))}%</b>。放宽“外在与仪表”1级，候选池预计扩大约 1.6 倍。</p><span className="difficulty">{compatibility > 70 ? "均衡匹配" : "有挑战"}</span></div>}
            </div>
          )}
        </section>
      )}

      {page === "admin" && (
        <section className="admin-page">
          <div className="admin-rail"><div className="eyebrow">MODEL CONTROL / 模型控制台</div><h1>让规则保持<br /><em>透明、可改。</em></h1><p>这里配置的是“市场基线权重”，用于统一比较。用户自己的择偶偏好会在匹配层单独计算。</p><div className="version-card"><span>当前版本</span><b>CN · V0.1</b><small>2026-08-17 发布草案</small><i>实验中</i></div><button className="secondary" onClick={() => setWeights(seedWeights)}>恢复推荐权重</button></div>
          <div className="config-card">
            <div className="config-head"><div><h2>评分项与权重</h2><p>启用项总权重：{weights.filter(i=>i.enabled).reduce((s,i)=>s+i.weight,0)} · 系统会自动归一化</p></div><button className="primary" onClick={saveWeights}>{saved ? "已保存 ✓" : "保存并应用"}</button></div>
            <div className="weight-table">
              <div className="weight-row header"><span>评分维度</span><span>权重</span><span>状态</span><span>影响</span></div>
              {weights.map((item, index) => <div className={`weight-row ${!item.enabled ? "disabled" : ""}`} key={item.key}><span><b>{String(index+1).padStart(2,"0")}</b>{item.label}</span><span><input aria-label={`${item.label}权重`} type="range" min="1" max="25" value={item.weight} onChange={(e)=>setWeights(weights.map((w,i)=>i===index?{...w,weight:Number(e.target.value)}:w))}/><strong>{item.weight}%</strong></span><span><button className={`switch ${item.enabled ? "on" : ""}`} aria-label={`${item.enabled ? "停用" : "启用"}${item.label}`} onClick={()=>setWeights(weights.map((w,i)=>i===index?{...w,enabled:!w.enabled}:w))}><i /></button></span><span>{item.weight >= 14 ? "高" : item.weight >= 9 ? "中" : "低"}</span></div>)}
            </div>
            <div className="data-sources"><div><b>数据基线</b><span>3 项已连接 · 2 项待补充样本</span></div><ul><li><i className="good"/>身高：国家卫健委，18–44岁，2020</li><li><i className="good"/>收入：国家统计局，居民收支，2025</li><li><i className="good"/>学历：第七次全国人口普查，2020</li><li><i/>储蓄：央行总量数据，需微观分布校准</li></ul></div>
          </div>
        </section>
      )}

      <footer><span>合盘 HEPAN · 条件评估实验室</span><p>结果仅用于自我认知与择偶偏好梳理，不构成对人的价值判断。</p><b>数据口径 V0.1</b></footer>
    </main>
  );
}
