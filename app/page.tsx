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
  family: number;
};

type SoftKey = "appearance" | "career" | "family";
type WeightItem = { key: keyof Profile; label: string; weight: number; enabled: boolean };
type TargetKind = "balanced" | "compatible" | "aspirational";

const profileSeed: Profile = { gender:"男", age:29, city:"新一线", height:178, appearance:7, education:4, income:28, savings:45, career:7, family:7 };
const targetSeeds: Record<TargetKind, Profile> = {
  compatible: { gender:"女", age:28, city:"新一线", height:162, appearance:6, education:2, income:12, savings:18, career:6, family:7 },
  balanced: { gender:"女", age:27, city:"新一线", height:165, appearance:7, education:3, income:20, savings:30, career:7, family:7 },
  aspirational: { gender:"女", age:26, city:"一线", height:168, appearance:9, education:4, income:35, savings:60, career:9, family:8 },
};

const weightsSeed: WeightItem[] = [
  {key:"appearance",label:"外在与仪表",weight:20,enabled:true},{key:"income",label:"收入水平",weight:16,enabled:true},
  {key:"age",label:"年龄适配",weight:12,enabled:true},{key:"education",label:"教育背景",weight:10,enabled:true},
  {key:"height",label:"身高体态",weight:8,enabled:true},{key:"savings",label:"储蓄与资产",weight:10,enabled:true},
  {key:"career",label:"职业发展",weight:16,enabled:true},{key:"family",label:"家庭支持与负担",weight:8,enabled:true},
];

const educationLabels = ["高中及以下","大专","普通本科","重点本科","硕士","博士"];
const newFirstTierCities = ["成都","杭州","重庆","武汉","苏州","西安","南京","长沙","郑州","天津","合肥","青岛","东莞","宁波","佛山"];
const softMeta: Record<SoftKey, { label:string; short:string; descriptions:string[] }> = {
  appearance: { label:"外在与仪表", short:"大众审美与实际第一印象", descriptions:[
    "未评分。","1分｜明显低于普遍审美，五官、体态与仪表多方面都较弱，通常会被直观评价为“丑”。","2分｜低于普遍审美，即使保持整洁，第一印象仍容易被认为不好看。","3分｜整体偏弱，但通过发型、体态和穿搭改善后可以明显提升。","4分｜略低于普通人水平，干净得体时不至于突兀，但外貌通常不是优势。","5分｜典型普通人，外貌不加分也不明显减分，辨识度较低。","6分｜普通人中较顺眼的一档，整体协调、耐看，偶尔会得到好看评价。","7分｜公认的帅或美，在同事、同学等熟人圈中通常属于外貌优势者。","8分｜很帅或很美，五官、体态与仪表都突出，在多数场合容易被注意。","9分｜顶帅或顶美，接近明星、模特级别，在现实人群中非常少见。","10分｜理论极值：外貌、体态、气质和镜头表现几乎无短板，现实中基本不存在。"] },
  career: { label:"职业发展", short:"结合城市、稳定性、收入与成长性", descriptions:[
    "未评分。","1分｜无稳定工作或长期失业，收入中断且没有清晰职业计划。","2分｜临时工、频繁换岗或高度不稳定的小微企业岗位，收入明显低于当地水平。","3分｜普通小型民企或基础服务岗位，能够就业，但稳定性、收入和成长空间都有限。","4分｜稳定的中小企业、技术或行政岗位，收入接近当地普通水平，有一定可积累能力。","5分｜成熟民企正式员工、专业技术岗位，或三四线城市一般国企/事业单位岗位，稳定与收入较均衡。","6分｜优质国企正式岗、地方银行稳定岗、低线城市公务员/事业编，或中型科技企业骨干，抗风险能力较好。","7分｜新一线/二线城市公务员或优质事业编、银行核心正式岗、大型国企骨干，或IT大厂成熟专业岗。","8分｜一线城市优质公务员/事业单位核心岗、央国企或银行总部骨干；IT大厂高级岗可达此级，但需扣除裁员风险。","9分｜一线城市核心体制内/央国企重要岗位，兼具稀缺平台、明确晋升与优厚保障；头部银行核心高薪岗也可接近。","10分｜一线城市极稀缺的核心体制内或中央级平台：稳定、待遇、资源、发展和社会认可几乎同时拉满，现实中极少。"] },
  family: { label:"家庭支持", short:"氛围、负担与边界", descriptions:[
    "原生家庭存在严重冲突或债务负担，且缺乏必要的个人边界。","家庭干预强、负担重，个人很难独立做出婚恋与生活决策。","有较明显的经济或照护压力，对亲密关系可能产生持续影响。","家庭支持有限但基本可控，边界问题仍需要双方耐心协商。","家庭关系和负担处于普通水平，重大事项可以进行基本沟通。","家庭氛围相对友善，经济与养老安排较清晰，尊重个人选择。","能提供稳定情感支持，家庭边界清晰，现实负担相对较轻。","双方父母开明、关系健康，能在需要时提供适度实际支持。","家庭资源、氛围和边界都很理想，对新家庭形成明显助力。","家庭高度和谐且保障充分，能够长期尊重并支持小家庭独立。","极其理想的支持系统：温暖、开明、低负担且资源充足。"] },
};

const targetInfo: Record<TargetKind,{name:string;tag:string;copy:string;color:string}> = {
  compatible:{name:"轻松相处型",tag:"更容易",copy:"条件门槛更包容，侧重稳定性与现实适配。",color:"mint"},
  balanced:{name:"势均力敌型",tag:"较均衡",copy:"综合条件接近，现实基础与关系质量兼顾。",color:"purple"},
  aspirational:{name:"理想进阶型",tag:"更有挑战",copy:"多项条件突出，候选更稀缺，匹配难度更高。",color:"yellow"},
};

function clamp(v:number,min=0,max=100){return Math.min(max,Math.max(min,v))}
function metricScore(key:keyof Profile,p:Profile){const v=p[key];if(typeof v!=="number")return 50;switch(key){case"age":{const ideal=p.gender==="男"?30:27;return clamp(100-Math.abs(p.age-ideal)*(p.age>ideal?4.2:2.4))}case"height":{const mean=p.gender==="男"?169.7:158;const high=p.gender==="男"?184:173;return clamp(45+((p.height-mean)/(high-mean))*45)}case"appearance":return p.appearance*10;case"education":return [35,50,66,78,89,96][p.education]??50;case"income":return clamp(26+Math.log1p(p.income/5)*29);case"savings":return clamp(25+Math.log1p(p.savings/8)*24);case"career":case"family":return p[key]*10;default:return 50}}
function calculate(p:Profile,weights:WeightItem[]){const active=weights.filter(w=>w.enabled),total=active.reduce((s,w)=>s+w.weight,0)||1;const dimensions=active.map(w=>({...w,score:Math.round(metricScore(w.key,p))}));const score=Math.round(dimensions.reduce((s,w)=>s+w.score*w.weight,0)/total);const percentile=Math.round(clamp(50+(score-62)*2.15,3,98));return{score,percentile,dimensions}}
function difficulty(own:number,target:number){const gap=target-own;if(gap<=-5)return{label:"容易",step:5,copy:"目标画像的综合门槛更宽松，条件层面较容易形成双向选择。"};if(gap<=1)return{label:"较易",step:4,copy:"双方综合条件接近，进入彼此选择范围的可能性相对较高。"};if(gap<=5)return{label:"适中",step:3,copy:"存在一定条件差，需要靠偏好契合与相处质量补足。"};if(gap<=9)return{label:"较难",step:2,copy:"目标相对稀缺，需要更强的个人特色或关系优势。"};return{label:"很难",step:1,copy:"目标画像非常稀缺，仅从条件层面看双向选择门槛较高。"}}

function InfoDot({text}:{text:string}){return <span className="info-dot" tabIndex={0} aria-label={text}>i<span>{text}</span></span>}
function itemInfo(key:keyof Profile|null,p:Profile,weights:WeightItem[]){if(!key)return"该项用于确定人群比较口径，不直接计入总分。";const active=weights.filter(w=>w.enabled),total=active.reduce((s,w)=>s+w.weight,0)||1,w=active.find(x=>x.key===key);if(!w)return"该项当前已在模型设置中停用，不计入总分。";const score=Math.round(metricScore(key,p)),normalized=w.weight/total*100,contribution=score*w.weight/total;return`当前单项 ${score}/100 · 总分权重 ${normalized.toFixed(1)}% · 贡献 ${contribution.toFixed(1)} 分。`}

function NumberField({label,value,onChange,unit,min=0,max=999,info}:{label:string;value:number;onChange:(v:number)=>void;unit?:string;min?:number;max?:number;info?:string}){
  const[draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value]);
  const change=(raw:string)=>{setDraft(raw);if(raw!==""){const parsed=Number(raw);if(Number.isFinite(parsed))onChange(parsed)}};
  const finish=()=>{if(draft===""){setDraft(String(value));return}const parsed=Number(draft);const next=Math.min(max,Math.max(min,Number.isFinite(parsed)?parsed:value));setDraft(String(next));if(next!==value)onChange(next)};
  return <label className="field"><span className="field-label">{label}{info&&<InfoDot text={info}/>}</span><div><input aria-label={label} type="number" inputMode="numeric" step="1" value={draft} min={min} max={max} onFocus={e=>e.currentTarget.select()} onChange={e=>change(e.target.value)} onBlur={finish}/>{unit&&<em>{unit}</em>}</div></label>
}

function SoftSlider({kind,value,onChange,city}:{kind:SoftKey;value:number;onChange:(v:number)=>void;city:string}){const meta=softMeta[kind];return <div className="soft-card"><div className="soft-title"><div><b>{meta.label}</b><span>{meta.short}</span></div><strong>{value}<small>/10</small></strong></div><input aria-label={`${meta.label}评分`} type="range" min="1" max="10" step="1" value={value} onChange={e=>onChange(Number(e.target.value))}/><div className="scale"><span>1</span><span>5</span><span>10</span></div><p key={value}><i>当前等级</i>{meta.descriptions[value]}</p>{kind==="appearance"&&<small className="model-caveat">仅描述大众审美中的相对位置，不代表个人价值。</small>}{kind==="career"&&<small className="model-caveat">当前选择：{city}城市口径。IT大厂等高薪岗位会同时考虑波动和裁员风险。</small>}</div>}

function Basics({profile,onChange,weights}:{profile:Profile;onChange:(p:Profile)=>void;weights:WeightItem[]}){const set=<K extends keyof Profile>(k:K,v:Profile[K])=>onChange({...profile,[k]:v});return <><div className="basics-grid"><label className="field"><span className="field-label">性别<InfoDot text={itemInfo(null,profile,weights)}/></span><select value={profile.gender} onChange={e=>set("gender",e.target.value as Profile["gender"])}><option>男</option><option>女</option></select></label><NumberField label="年龄" value={profile.age} min={18} max={65} unit="岁" info={itemInfo("age",profile,weights)} onChange={v=>set("age",v)}/><label className="field"><span className="field-label">常住城市<InfoDot text={itemInfo(null,profile,weights)}/></span><select value={profile.city} onChange={e=>set("city",e.target.value)}><option value="一线">一线（北上广深）</option><option value="新一线">新一线（15城）</option><option>二线</option><option>三线及以下</option></select></label><NumberField label="身高" value={profile.height} min={140} max={210} unit="cm" info={itemInfo("height",profile,weights)} onChange={v=>set("height",v)}/><label className="field"><span className="field-label">最高学历<InfoDot text={itemInfo("education",profile,weights)}/></span><select value={profile.education} onChange={e=>set("education",Number(e.target.value))}>{educationLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></label><NumberField label="税前年收入" value={profile.income} unit="万" info={itemInfo("income",profile,weights)} onChange={v=>set("income",v)}/><NumberField label="可支配储蓄" value={profile.savings} unit="万" info={itemInfo("savings",profile,weights)} onChange={v=>set("savings",v)}/></div>{profile.city==="新一线"&&<div className="city-explain"><b>新一线 · 2025榜单口径</b><span>{newFirstTierCities.join("、")}</span><small>这是第一财经的商业魅力榜单，并非行政级别。2026年报告已停止发布城市排名与分级。</small><a href="https://www.yicai.com/news/102638963.html" target="_blank" rel="noreferrer">查看来源</a></div>}</>}

function ResultHero({profile,weights}:{profile:Profile;weights:WeightItem[]}){const result=useMemo(()=>calculate(profile,weights),[profile,weights]);const top=[...result.dimensions].sort((a,b)=>b.score-a.score)[0],total=result.dimensions.reduce((s,x)=>s+x.weight,0)||1;return <><section className="result-hero"><div className="result-copy"><span className="mini-label">你的条件画像</span><h1>{result.percentile>=82?"优势清晰型":result.percentile>=65?"稳健平衡型":"成长潜力型"}</h1><p>你的综合条件呈现出稳定、均衡的基础。<b>{top?.label}</b>是当前最鲜明的优势。</p><div className="result-actions"><button onClick={()=>document.querySelector("#profile-editor")?.scrollIntoView({behavior:"smooth"})}>调整我的资料</button><span>同口径：{profile.gender} · {profile.city} · 25–34 岁</span></div></div><div className="result-visual"><div className="orbit one"/><div className="orbit two"/><div className="avatar-shape"><i/><b/><span/></div></div><div className="score-summary"><small>综合条件分</small><strong>{result.score}</strong><span>/100</span><div className="percent-bar"><i style={{width:`${result.percentile}%`}}/></div><p>高于同口径人群的 <b>{result.percentile}%</b></p></div></section><section className="score-breakdown"><div className="breakdown-head"><div><span>总分构成</span><h2>每一分从哪里来</h2></div><p>贡献分 = 单项分 × 归一化权重；全部贡献分相加即为综合条件分。</p></div><div className="breakdown-grid">{result.dimensions.map(item=>{const normalized=item.weight/total*100,contribution=item.score*item.weight/total;return <div className="breakdown-item" key={item.key}><div><span>{item.label}</span><strong>{item.score}<small>/100</small></strong></div><i><b style={{width:`${item.score}%`}}/></i><p><span>权重 {normalized.toFixed(1)}%</span><em>贡献 {contribution.toFixed(1)} 分</em></p></div>})}</div></section></>}

function ProfileEditor({profile,onChange,weights}:{profile:Profile;onChange:(p:Profile)=>void;weights:WeightItem[]}){const set=(k:SoftKey,v:number)=>onChange({...profile,[k]:v});return <section className="editor-section" id="profile-editor"><div className="section-heading"><span>01</span><div><h2>完善你的条件画像</h2><p>拖动评分时，对应等级的具体行为描述会同步变化。</p></div></div><div className="white-panel"><h3>基础条件</h3><Basics profile={profile} onChange={onChange} weights={weights}/></div><div className="soft-grid">{(Object.keys(softMeta) as SoftKey[]).map(k=><SoftSlider key={k} kind={k} value={profile[k]} city={profile.city} onChange={v=>set(k,v)}/>)}</div></section>}

function TargetEditor({target,onChange,ownScore,weights}:{target:Profile;onChange:(p:Profile)=>void;ownScore:number;weights:WeightItem[]}){const result=calculate(target,weights),level=difficulty(ownScore,result.score);const set=(k:SoftKey,v:number)=>onChange({...target,[k]:v});return <div className="target-editor"><div className="target-live"><div><span>当前目标分</span><strong>{result.score}</strong><small>/100</small></div><div className="difficulty"><span>匹配难度</span><b>{level.label}</b><div>{[1,2,3,4,5].map(n=><i className={n<=level.step?"on":""} key={n}/>)}</div></div><p>{level.copy}</p></div><div className="white-panel"><h3>调整目标基础条件</h3><Basics profile={target} onChange={onChange} weights={weights}/></div><div className="target-soft">{(Object.keys(softMeta) as SoftKey[]).map(k=><SoftSlider key={k} kind={k} value={target[k]} city={target.city} onChange={v=>set(k,v)}/>)}</div></div>}

export default function Home(){const[page,setPage]=useState<"profile"|"match"|"settings">("profile");const[profile,setProfile]=useState(profileSeed);const[targets,setTargets]=useState(targetSeeds);const[active,setActive]=useState<TargetKind>("balanced");const[weights,setWeights]=useState(weightsSeed);const[saved,setSaved]=useState(false);useEffect(()=>{const raw=localStorage.getItem("hepan-config");if(raw)try{const old=JSON.parse(raw) as WeightItem[];setWeights(weightsSeed.map(seed=>{const saved=old.find(item=>item.key===seed.key);return saved?{...seed,weight:saved.weight,enabled:saved.enabled}:seed}))}catch{}},[]);const own=calculate(profile,weights);const updateTarget=(p:Profile)=>setTargets({...targets,[active]:p});const save=()=>{localStorage.setItem("hepan-config",JSON.stringify(weights));setSaved(true);setTimeout(()=>setSaved(false),1600)};
  return <main><header><button className="logo" onClick={()=>setPage("profile")}><i>H</i><span>Hepan<small>条件匹配实验室</small></span></button><nav><button className={page==="profile"?"active":""} onClick={()=>setPage("profile")}>我的画像</button><button className={page==="match"?"active":""} onClick={()=>setPage("match")}>目标推荐</button><button className={page==="settings"?"active":""} onClick={()=>setPage("settings")}>模型设置</button></nav><div className="privacy"><i/>资料仅保存在本机</div></header>
  {page==="profile"&&<><ResultHero profile={profile} weights={weights}/><ProfileEditor profile={profile} onChange={setProfile} weights={weights}/></>}
  {page==="match"&&<section className="match-page"><div className="page-intro"><span className="mini-label">基于你的 {own.score} 分生成</span><h1>三个值得考虑的目标画像</h1><p>选择一种方向，再自由移动对方的各项指标。总分和匹配难度会实时变化。</p></div><div className="target-cards">{(Object.keys(targetInfo) as TargetKind[]).map(k=>{const r=calculate(targets[k],weights),info=targetInfo[k],d=difficulty(own.score,r.score);return <button key={k} className={`${info.color} ${active===k?"selected":""}`} onClick={()=>setActive(k)}><span>{info.tag}</span><div className="target-icon"><i/><b/></div><h2>{info.name}</h2><p>{info.copy}</p><div className="target-score"><strong>{r.score}</strong><small>分</small><em>{d.label}</em></div></button>})}</div><TargetEditor target={targets[active]} onChange={updateTarget} ownScore={own.score} weights={weights}/></section>}
  {page==="settings"&&<section className="settings-page"><div className="page-intro"><span className="mini-label">模型设置</span><h1>评分规则，透明可调</h1><p>这里配置统一的人群基线。你的个人偏好只用于目标推荐，不会改变自己的基础分。</p></div><div className="settings-card"><div className="settings-head"><div><h2>评分维度与权重</h2><p>启用权重合计 {weights.filter(w=>w.enabled).reduce((s,w)=>s+w.weight,0)}，计算时自动归一化</p></div><button onClick={save}>{saved?"已保存 ✓":"保存设置"}</button></div>{weights.map((w,i)=><div className={`weight-line ${!w.enabled?"off":""}`} key={w.key}><span>{w.label}</span><input type="range" min="1" max="25" value={w.weight} onChange={e=>setWeights(weights.map((x,n)=>n===i?{...x,weight:Number(e.target.value)}:x))}/><strong>{w.weight}%</strong><button aria-label={`${w.enabled?"停用":"启用"}${w.label}`} className={w.enabled?"toggle on":"toggle"} onClick={()=>setWeights(weights.map((x,n)=>n===i?{...x,enabled:!x.enabled}:x))}><i/></button></div>)}</div></section>}
  <footer><b>Hepan</b><span>结果用于自我认知和偏好梳理，不代表人的价值。</span><a href="https://www.16personalities.com/free-personality-test" target="_blank" rel="noreferrer">界面风格参考</a></footer></main>}
