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

type SoftKey = "appearance" | "career" | "personality" | "family" | "lifestyle";
type WeightItem = { key: keyof Profile; label: string; weight: number; enabled: boolean };
type TargetKind = "balanced" | "compatible" | "aspirational";

const profileSeed: Profile = { gender:"男", age:29, city:"新一线", height:178, appearance:7, education:4, income:28, savings:45, career:7, personality:8, family:7, lifestyle:8 };
const targetSeeds: Record<TargetKind, Profile> = {
  compatible: { gender:"女", age:28, city:"新一线", height:162, appearance:6, education:2, income:12, savings:18, career:6, personality:8, family:7, lifestyle:8 },
  balanced: { gender:"女", age:27, city:"新一线", height:165, appearance:7, education:3, income:20, savings:30, career:7, personality:8, family:7, lifestyle:8 },
  aspirational: { gender:"女", age:26, city:"一线", height:168, appearance:9, education:4, income:35, savings:60, career:9, personality:8, family:8, lifestyle:9 },
};

const weightsSeed: WeightItem[] = [
  {key:"appearance",label:"外在与仪表",weight:16,enabled:true},{key:"income",label:"收入水平",weight:14,enabled:true},
  {key:"personality",label:"性格与关系能力",weight:16,enabled:true},{key:"age",label:"年龄适配",weight:10,enabled:true},
  {key:"education",label:"教育背景",weight:9,enabled:true},{key:"height",label:"身高体态",weight:7,enabled:true},
  {key:"savings",label:"储蓄与资产",weight:8,enabled:true},{key:"career",label:"职业发展",weight:8,enabled:true},
  {key:"family",label:"家庭支持与负担",weight:6,enabled:true},{key:"lifestyle",label:"生活方式",weight:6,enabled:true},
];

const educationLabels = ["高中及以下","大专","普通本科","重点本科","硕士","博士"];
const softMeta: Record<SoftKey, { label:string; short:string; descriptions:string[] }> = {
  appearance: { label:"外在与仪表", short:"整洁、体态与审美", descriptions:[
    "长期忽视清洁和基本仪表，第一印象通常明显减分。","能维持基础卫生，但衣着和精神状态经常比较随意。","基本干净得体，尚未形成适合自己的穿搭与形象习惯。","日常整洁，重要场合知道如何保持合适、自然的外在状态。","仪表稳定得体，体态和穿搭在普通人群中处于中等水平。","能根据场合管理形象，整体协调，给人舒服可靠的第一印象。","有适合自己的风格，精神状态和体态多数时候表现良好。","审美、体态与形象管理均较突出，常能获得正向外貌评价。","外在辨识度高，镜头与现实表现都较稳定，属于明显优势项。","形象条件与管理能力非常突出，在多数社交场景中都很抢眼。","极具辨识度且长期维持优秀状态，属于人群中非常少见的水平。"] },
  career: { label:"职业发展", short:"稳定性与成长性", descriptions:[
    "目前没有稳定职业计划，收入和工作状态长期不可预期。","工作频繁中断或更换，尚未形成明确方向和可积累能力。","已有工作，但稳定性、技能积累或未来路径仍比较薄弱。","能维持基本稳定，开始形成职业方向，但成长速度相对有限。","职业状态稳定，能力与收入大体符合年龄和所在城市水平。","拥有清晰路径和可迁移能力，未来三年有较可靠的增长预期。","在行业中具备竞争力，工作稳定且晋升或收入成长可见。","处于骨干或高潜阶段，专业壁垒和未来选择都比较充足。","职业稀缺度高，已形成显著的职位、专业或资源优势。","在细分领域处于领先位置，拥有很强的持续增长与抗风险能力。","行业头部或创业成果突出，职业影响力与资源极为稀缺。"] },
  personality: { label:"关系与沟通", short:"情绪、沟通与责任感", descriptions:[
    "经常失控、冷暴力或逃避责任，难以建立安全和稳定的关系。","冲突中容易攻击或彻底回避，很少顾及对方的感受与边界。","知道关系需要沟通，但情绪波动时仍常采用不健康的应对方式。","能进行基础沟通，偶尔会防御或逃避，事后通常愿意修复。","多数时候情绪稳定，能够表达需求并承担关系中的基本责任。","愿意倾听和协商，发生矛盾时能把问题与人分开处理。","共情、边界和责任感均较成熟，能主动维护长期关系质量。","面对压力仍能稳定沟通，也能识别并回应伴侣的真实需求。","具备很强的情绪容纳与关系修复能力，相处安全感明显。","高度成熟可靠，能在复杂冲突中保持尊重、清晰与建设性。","极少见的关系能力：稳定、自省、共情、边界与承诺高度一致。"] },
  family: { label:"家庭支持", short:"氛围、负担与边界", descriptions:[
    "原生家庭存在严重冲突或债务负担，且缺乏必要的个人边界。","家庭干预强、负担重，个人很难独立做出婚恋与生活决策。","有较明显的经济或照护压力，对亲密关系可能产生持续影响。","家庭支持有限但基本可控，边界问题仍需要双方耐心协商。","家庭关系和负担处于普通水平，重大事项可以进行基本沟通。","家庭氛围相对友善，经济与养老安排较清晰，尊重个人选择。","能提供稳定情感支持，家庭边界清晰，现实负担相对较轻。","双方父母开明、关系健康，能在需要时提供适度实际支持。","家庭资源、氛围和边界都很理想，对新家庭形成明显助力。","家庭高度和谐且保障充分，能够长期尊重并支持小家庭独立。","极其理想的支持系统：温暖、开明、低负担且资源充足。"] },
  lifestyle: { label:"生活方式", short:"健康、家务与消费观", descriptions:[
    "作息、卫生、消费或成瘾习惯严重影响正常生活与长期健康。","生活长期失序，缺乏基本自理能力，也没有明显改善意愿。","能完成基础生活事务，但作息、家务或财务习惯问题较多。","生活基本独立，偶尔失衡，对共同生活规则需要较多磨合。","有普通水平的健康、家务和消费习惯，能够维持稳定生活。","作息与消费相对理性，愿意公平分担家务并照顾共同空间。","拥有稳定健康习惯，生活有规划，消费观与责任感较成熟。","自律但不僵化，能兼顾健康、品质、储蓄与共同生活体验。","生活管理能力突出，长期习惯健康，家务和财务合作顺畅。","生活方式高度稳定且有品质，能持续提升伴侣的生活体验。","极少见的全面生活能力：健康、自律、松弛、负责且富有情趣。"] },
};

const targetInfo: Record<TargetKind,{name:string;tag:string;copy:string;color:string}> = {
  compatible:{name:"轻松相处型",tag:"更容易",copy:"条件门槛更包容，重视沟通和共同生活感。",color:"mint"},
  balanced:{name:"势均力敌型",tag:"较均衡",copy:"综合条件接近，现实基础与关系质量兼顾。",color:"purple"},
  aspirational:{name:"理想进阶型",tag:"更有挑战",copy:"多项条件突出，候选更稀缺，匹配难度更高。",color:"yellow"},
};

function clamp(v:number,min=0,max=100){return Math.min(max,Math.max(min,v))}
function metricScore(key:keyof Profile,p:Profile){const v=p[key];if(typeof v!=="number")return 50;switch(key){case"age":{const ideal=p.gender==="男"?30:27;return clamp(100-Math.abs(p.age-ideal)*(p.age>ideal?4.2:2.4))}case"height":{const mean=p.gender==="男"?169.7:158;const high=p.gender==="男"?184:173;return clamp(45+((p.height-mean)/(high-mean))*45)}case"appearance":return p.appearance*10;case"education":return [35,50,66,78,89,96][p.education]??50;case"income":return clamp(26+Math.log1p(p.income/5)*29);case"savings":return clamp(25+Math.log1p(p.savings/8)*24);case"career":case"personality":case"family":case"lifestyle":return p[key]*10;default:return 50}}
function calculate(p:Profile,weights:WeightItem[]){const active=weights.filter(w=>w.enabled),total=active.reduce((s,w)=>s+w.weight,0)||1;const dimensions=active.map(w=>({...w,score:Math.round(metricScore(w.key,p))}));const score=Math.round(dimensions.reduce((s,w)=>s+w.score*w.weight,0)/total);const percentile=Math.round(clamp(50+(score-62)*2.15,3,98));return{score,percentile,dimensions}}
function difficulty(own:number,target:number){const gap=target-own;if(gap<=-5)return{label:"容易",step:5,copy:"目标画像的综合门槛更宽松，条件层面较容易形成双向选择。"};if(gap<=1)return{label:"较易",step:4,copy:"双方综合条件接近，进入彼此选择范围的可能性相对较高。"};if(gap<=5)return{label:"适中",step:3,copy:"存在一定条件差，需要靠偏好契合与相处质量补足。"};if(gap<=9)return{label:"较难",step:2,copy:"目标相对稀缺，需要更强的个人特色或关系优势。"};return{label:"很难",step:1,copy:"目标画像非常稀缺，仅从条件层面看双向选择门槛较高。"}}

function NumberField({label,value,onChange,unit,min=0,max=999}:{label:string;value:number;onChange:(v:number)=>void;unit?:string;min?:number;max?:number}){
  const[draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value]);
  const change=(raw:string)=>{setDraft(raw);if(raw!==""){const parsed=Number(raw);if(Number.isFinite(parsed))onChange(parsed)}};
  const finish=()=>{if(draft===""){setDraft(String(value));return}const parsed=Number(draft);const next=Math.min(max,Math.max(min,Number.isFinite(parsed)?parsed:value));setDraft(String(next));if(next!==value)onChange(next)};
  return <label className="field"><span>{label}</span><div><input aria-label={label} type="number" inputMode="numeric" step="1" value={draft} min={min} max={max} onFocus={e=>e.currentTarget.select()} onChange={e=>change(e.target.value)} onBlur={finish}/>{unit&&<em>{unit}</em>}</div></label>
}

function SoftSlider({kind,value,onChange}:{kind:SoftKey;value:number;onChange:(v:number)=>void}){const meta=softMeta[kind];return <div className="soft-card"><div className="soft-title"><div><b>{meta.label}</b><span>{meta.short}</span></div><strong>{value}<small>/10</small></strong></div><input aria-label={`${meta.label}评分`} type="range" min="0" max="10" step="1" value={value} onChange={e=>onChange(Number(e.target.value))}/><div className="scale"><span>0</span><span>5</span><span>10</span></div><p key={value}><i>当前等级</i>{meta.descriptions[value]}</p></div>}

function Basics({profile,onChange}:{profile:Profile;onChange:(p:Profile)=>void}){const set=<K extends keyof Profile>(k:K,v:Profile[K])=>onChange({...profile,[k]:v});return <div className="basics-grid"><label className="field"><span>性别</span><select value={profile.gender} onChange={e=>set("gender",e.target.value as Profile["gender"])}><option>男</option><option>女</option></select></label><NumberField label="年龄" value={profile.age} min={18} max={65} unit="岁" onChange={v=>set("age",v)}/><label className="field"><span>常住城市</span><select value={profile.city} onChange={e=>set("city",e.target.value)}><option>一线</option><option>新一线</option><option>二线</option><option>三线及以下</option></select></label><NumberField label="身高" value={profile.height} min={140} max={210} unit="cm" onChange={v=>set("height",v)}/><label className="field"><span>最高学历</span><select value={profile.education} onChange={e=>set("education",Number(e.target.value))}>{educationLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></label><NumberField label="税前年收入" value={profile.income} unit="万" onChange={v=>set("income",v)}/><NumberField label="可支配储蓄" value={profile.savings} unit="万" onChange={v=>set("savings",v)}/></div>}

function ResultHero({profile,weights}:{profile:Profile;weights:WeightItem[]}){const result=useMemo(()=>calculate(profile,weights),[profile,weights]);const top=[...result.dimensions].sort((a,b)=>b.score-a.score)[0];return <section className="result-hero"><div className="result-copy"><span className="mini-label">你的条件画像</span><h1>{result.percentile>=82?"优势清晰型":result.percentile>=65?"稳健平衡型":"成长潜力型"}</h1><p>你的综合条件呈现出稳定、均衡的基础。<b>{top?.label}</b>是当前最鲜明的优势。</p><div className="result-actions"><button onClick={()=>document.querySelector("#profile-editor")?.scrollIntoView({behavior:"smooth"})}>调整我的资料</button><span>同口径：{profile.gender} · {profile.city} · 25–34 岁</span></div></div><div className="result-visual"><div className="orbit one"/><div className="orbit two"/><div className="avatar-shape"><i/><b/><span/></div></div><div className="score-summary"><small>综合条件分</small><strong>{result.score}</strong><span>/100</span><div className="percent-bar"><i style={{width:`${result.percentile}%`}}/></div><p>高于同口径人群的 <b>{result.percentile}%</b></p></div></section>}

function ProfileEditor({profile,onChange}:{profile:Profile;onChange:(p:Profile)=>void}){const set=(k:SoftKey,v:number)=>onChange({...profile,[k]:v});return <section className="editor-section" id="profile-editor"><div className="section-heading"><span>01</span><div><h2>完善你的条件画像</h2><p>拖动评分时，对应等级的具体行为描述会同步变化。</p></div></div><div className="white-panel"><h3>基础条件</h3><Basics profile={profile} onChange={onChange}/></div><div className="soft-grid">{(Object.keys(softMeta) as SoftKey[]).map(k=><SoftSlider key={k} kind={k} value={profile[k]} onChange={v=>set(k,v)}/>)}</div></section>}

function TargetEditor({target,onChange,ownScore,weights}:{target:Profile;onChange:(p:Profile)=>void;ownScore:number;weights:WeightItem[]}){const result=calculate(target,weights),level=difficulty(ownScore,result.score);const set=(k:SoftKey,v:number)=>onChange({...target,[k]:v});return <div className="target-editor"><div className="target-live"><div><span>当前目标分</span><strong>{result.score}</strong><small>/100</small></div><div className="difficulty"><span>匹配难度</span><b>{level.label}</b><div>{[1,2,3,4,5].map(n=><i className={n<=level.step?"on":""} key={n}/>)}</div></div><p>{level.copy}</p></div><div className="white-panel"><h3>调整目标基础条件</h3><Basics profile={target} onChange={onChange}/></div><div className="target-soft">{(Object.keys(softMeta) as SoftKey[]).map(k=><SoftSlider key={k} kind={k} value={target[k]} onChange={v=>set(k,v)}/>)}</div></div>}

export default function Home(){const[page,setPage]=useState<"profile"|"match"|"settings">("profile");const[profile,setProfile]=useState(profileSeed);const[targets,setTargets]=useState(targetSeeds);const[active,setActive]=useState<TargetKind>("balanced");const[weights,setWeights]=useState(weightsSeed);const[saved,setSaved]=useState(false);useEffect(()=>{const raw=localStorage.getItem("hepan-config");if(raw)try{setWeights(JSON.parse(raw))}catch{}},[]);const own=calculate(profile,weights);const updateTarget=(p:Profile)=>setTargets({...targets,[active]:p});const save=()=>{localStorage.setItem("hepan-config",JSON.stringify(weights));setSaved(true);setTimeout(()=>setSaved(false),1600)};
  return <main><header><button className="logo" onClick={()=>setPage("profile")}><i>H</i><span>Hepan<small>条件匹配实验室</small></span></button><nav><button className={page==="profile"?"active":""} onClick={()=>setPage("profile")}>我的画像</button><button className={page==="match"?"active":""} onClick={()=>setPage("match")}>目标推荐</button><button className={page==="settings"?"active":""} onClick={()=>setPage("settings")}>模型设置</button></nav><div className="privacy"><i/>资料仅保存在本机</div></header>
  {page==="profile"&&<><ResultHero profile={profile} weights={weights}/><ProfileEditor profile={profile} onChange={setProfile}/></>}
  {page==="match"&&<section className="match-page"><div className="page-intro"><span className="mini-label">基于你的 {own.score} 分生成</span><h1>三个值得考虑的目标画像</h1><p>选择一种方向，再自由移动对方的各项指标。总分和匹配难度会实时变化。</p></div><div className="target-cards">{(Object.keys(targetInfo) as TargetKind[]).map(k=>{const r=calculate(targets[k],weights),info=targetInfo[k],d=difficulty(own.score,r.score);return <button key={k} className={`${info.color} ${active===k?"selected":""}`} onClick={()=>setActive(k)}><span>{info.tag}</span><div className="target-icon"><i/><b/></div><h2>{info.name}</h2><p>{info.copy}</p><div className="target-score"><strong>{r.score}</strong><small>分</small><em>{d.label}</em></div></button>})}</div><TargetEditor target={targets[active]} onChange={updateTarget} ownScore={own.score} weights={weights}/></section>}
  {page==="settings"&&<section className="settings-page"><div className="page-intro"><span className="mini-label">模型设置</span><h1>评分规则，透明可调</h1><p>这里配置统一的人群基线。你的个人偏好只用于目标推荐，不会改变自己的基础分。</p></div><div className="settings-card"><div className="settings-head"><div><h2>评分维度与权重</h2><p>启用权重合计 {weights.filter(w=>w.enabled).reduce((s,w)=>s+w.weight,0)}，计算时自动归一化</p></div><button onClick={save}>{saved?"已保存 ✓":"保存设置"}</button></div>{weights.map((w,i)=><div className={`weight-line ${!w.enabled?"off":""}`} key={w.key}><span>{w.label}</span><input type="range" min="1" max="25" value={w.weight} onChange={e=>setWeights(weights.map((x,n)=>n===i?{...x,weight:Number(e.target.value)}:x))}/><strong>{w.weight}%</strong><button aria-label={`${w.enabled?"停用":"启用"}${w.label}`} className={w.enabled?"toggle on":"toggle"} onClick={()=>setWeights(weights.map((x,n)=>n===i?{...x,enabled:!x.enabled}:x))}><i/></button></div>)}</div></section>}
  <footer><b>Hepan</b><span>结果用于自我认知和偏好梳理，不代表人的价值。</span><a href="https://www.16personalities.com/free-personality-test" target="_blank" rel="noreferrer">界面风格参考</a></footer></main>}
