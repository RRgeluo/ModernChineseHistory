import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

type Event = {
  id: string;
  date: string; // 规范化日期用于排序 YYYY-MM-DD
  displayDate: string; // 卷面显示日期
  title: string;
  people: string;
  summary: string; // 事件梗概
  meaning: string; // 历史意义
};

const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    date: '1840-06-01',
    displayDate: '1840年6月',
    title: '第一次鸦片战争',
    people: '清政府、英国侵略军',
    summary: '英国以虎门销烟为借口发动侵略战争。清廷战败，被迫签订《南京条约》，开放五口通商并割让香港岛。',
    meaning: '中国近代史的开端，中国开始沦为半殖民地半封建社会，丧失了独立自主的地位。',
  },
  {
    id: '2',
    date: '1851-01-11',
    displayDate: '1851年-1864年',
    title: '太平天国运动',
    people: '洪秀全、杨秀清、曾国藩',
    summary: '洪秀全在金田起义，建号“太平天国”。1853年定都天京，颁布《天朝田亩制度》。后因内讧及中外势力联合镇压而失败。',
    meaning: '中国历史上规模空前的农民战争，沉重打击了清朝统治和外国侵略，加速了清廷内部改革的启动。',
  },
  {
    id: '3',
    date: '1856-10-01',
    displayDate: '1856年-1860年',
    title: '第二次鸦片战争',
    people: '咸丰帝、奕䜣、额尔金',
    summary: '英法联合发动战争。1860年联军攻陷北京，火烧圆明园，迫使清廷签订《北京条约》。',
    meaning: '中国半殖民地化程度大幅加深，丧失了更多领土和主权，清廷开始意识到需向西方学习科技。',
  },
  {
    id: '4',
    date: '1861-01-01',
    displayDate: '19世纪60-90年代',
    title: '洋务运动',
    people: '奕䜣、曾国藩、李鸿章',
    summary: '统治集团内部以“自强”“求富”为口号，创办近代军事和民用工业，建立新式海军（北洋水师）和学堂。',
    meaning: '中国近代化的开端，引进了西方科技，促进了民族资本主义的产生，具有重要的启蒙作用。',
  },
  {
    id: '5',
    date: '1894-07-25',
    displayDate: '1894年-1895年',
    title: '甲午中日战争',
    people: '李鸿章、丁汝昌、邓世昌',
    meaning: '宣告洋务运动失败，民族危机空前严重，半殖民地化程度大大加深，刺激了列强瓜分狂潮。',
    summary: '日本挑起战争，清军在平壤之战、黄海海战中接连失利，北洋水师全军覆没。签订《马关条约》，割让台湾。',
  },
  {
    id: '6',
    date: '1898-06-11',
    displayDate: '1898年',
    title: '戊戌变法',
    people: '光绪帝、康有为、梁启超',
    summary: '维新派在光绪帝支持下推行政治改革。历时103天后被慈禧太后发动的政变镇压。',
    meaning: '爱国救亡的政治改良运动，促进了思想启蒙，证明在旧中国君主立宪道路行不通。',
  },
  {
    id: '7',
    date: '1911-10-10',
    displayDate: '1911年-1912年',
    title: '辛亥革命',
    people: '孙中山、黄兴、袁世凯',
    summary: '武昌起义爆发后全国响应，清帝退位。1912年元旦中华民国临时政府在南京成立。',
    meaning: '推翻了封建君主专制，建立了亚洲第一个共和国，使民主共和观念深入人心。',
  },
  {
    id: '8',
    date: '1915-09-15',
    displayDate: '1915年-1920年代',
    title: '新文化运动',
    people: '陈独秀、胡适、鲁迅',
    summary: '以《新青年》为阵地，提倡民主与科学，批判封建礼教，推行白话文，后期开始传播马克思主义。',
    meaning: '深刻的思想启蒙运动，动摇了封建正统思想地位，为五四运动奠定了思想基础。',
  },
  {
    id: '9',
    date: '1919-05-04',
    displayDate: '1919年5月4日',
    title: '五四运动',
    people: '学生领袖、陈独秀、李大钊',
    summary: '因巴黎和会外交失败，学生举行游行。运动席卷全国，形成“三罢”斗争，北洋政府最终拒签和约。',
    meaning: '彻底的反帝反封建爱国革命运动，标志着中国无产阶级登上政治舞台，新民主主义革命的开端。',
  },
  {
    id: '10',
    date: '1921-07-23',
    displayDate: '1921年7月',
    title: '中国共产党成立',
    people: '毛泽东、董必武、李达',
    summary: '中共一大在上海召开，通过党纲，选举陈独秀为中央局书记。最后一天在嘉兴南湖游船举行。',
    meaning: '开天辟地的大事变，中国革命从此有了坚强的领导核心，面貌焕然一新。',
  },
  {
    id: '11',
    date: '1927-08-01',
    displayDate: '1927年8月1日',
    title: '南昌起义',
    people: '周恩来、贺龙、朱德',
    summary: '周恩来等率领两万余人起义控制南昌城，打响了反抗国民党反动派的第一枪。',
    meaning: '标志着党独立领导革命战争、创建人民军队的开始，是人民军队诞生的起点。',
  },
  {
    id: '12',
    date: '1934-10-10',
    displayDate: '1934年10月-1936年10月',
    title: '红军长征',
    people: '毛泽东、周恩来、朱德',
    summary: '红军因第五次反围剿失败被迫战略转移，历经万水千山，三大主力最终在会宁胜利会师。',
    meaning: '保存了革命骨干，磨炼了意志，实现了中国革命从挫折走向胜利的伟大转折。',
  },
  {
    id: '13',
    date: '1936-12-12',
    displayDate: '1936年12月12日',
    title: '西安事变',
    people: '张学良、杨虎城、周恩来',
    summary: '张杨发动“兵谏”扣押蒋介石。经中共多方周旋，最终和平解决，蒋接受联共抗日。',
    meaning: '十年内战基本结束，抗日民族统一战线初步形成，时局扭转的关键枢纽。',
  },
  {
    id: '14',
    date: '1937-07-07',
    displayDate: '1937年7月7日',
    title: '七七事变',
    people: '宋哲元、吉星文',
    summary: '日军在卢沟桥制造借口炮轰宛平城，中国第29军奋起抵抗，全民族抗战爆发。',
    meaning: '日本全面侵华战争的起点，也是中华民族全民族抗战的伟大开端。',
  },
  {
    id: '15',
    date: '1945-08-15',
    displayDate: '1945年8月15日',
    title: '日本投降',
    people: '昭和天皇',
    summary: '日本宣布接受《波茨坦公告》，无条件投降。中国抗日战争取得最终胜利。',
    meaning: '彻底洗刷百年屈辱，是中华民族由衰败走向复兴的伟大历史转折点。',
  },
  {
    id: '16',
    date: '1945-10-10',
    displayDate: '1945年10月10日',
    title: '双十协定签署',
    people: '毛泽东、蒋介石、周恩来',
    summary: '国共在重庆谈判结束，签署协定，同意和平建国，避免内战。',
    meaning: '确立了和平建国的大纲，中共赢得了政治主动权和广大民心的拥护。',
  },
];

const App = () => {
  // 从本地存储加载数据
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('modern_china_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [mainTitle, setMainTitle] = useState(() => {
    return localStorage.getItem('modern_china_main_title') || '中国近代史编年长卷';
  });
  const [subTitle, setSubTitle] = useState(() => {
    return localStorage.getItem('modern_china_sub_title') || '1840 — 1945：民族抗争与复兴之路';
  });
  
  const [footerTitle, setFooterTitle] = useState('鉴往知来 · 薪火相传');
  const [footerSub, setFooterSub] = useState('Chronicles of Modern China');
  
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartImportText, setSmartImportText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);

  // 持久化保存
  useEffect(() => {
    localStorage.setItem('modern_china_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('modern_china_main_title', mainTitle);
  }, [mainTitle]);

  useEffect(() => {
    localStorage.setItem('modern_china_sub_title', subTitle);
  }, [subTitle]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const handleSmartImport = async () => {
    if (!smartImportText.trim()) return;
    setIsParsing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位严谨的历史史料整理专家。请从以下文本中自动分段并提取历史事件，以 JSON 数组格式返回。
        
        解析要求：
        1. 批量分段：文本中包含多个历史节点时，必须逐一拆分。
        2. 时间映射：
           - displayDate: 精确保留原文时间描述（如“1945年秋”、“19世纪末”）。
           - date: 规范化为 YYYY-MM-DD 用于自动排序。
        3. 字段提取：
           - title: 事件名称。
           - people: 核心人物。
           - summary: 事件的具体过程梗概（100字以内）。
           - meaning: 事件的历史意义与地位（60字以内）。
        
        待解析史料：\n\n${smartImportText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                displayDate: { type: Type.STRING },
                title: { type: Type.STRING },
                people: { type: Type.STRING },
                summary: { type: Type.STRING },
                meaning: { type: Type.STRING },
              },
              required: ["date", "displayDate", "title", "people", "summary", "meaning"],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || "[]");
      const newEvents = parsed.map((ev: any) => ({
        ...ev,
        id: Math.random().toString(36).substr(2, 9),
      }));
      
      if (newEvents.length > 0) {
        setEvents(prev => [...prev, ...newEvents]);
        setIsSmartImportOpen(false);
        setSmartImportText('');
      } else {
        alert("未能识别历史事件，请尝试更详细的描述。");
      }
    } catch (error) {
      alert("智能解析失败，请检查网络或输入的文本格式。");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    const finalEvent = { ...editingEvent };
    if (!finalEvent.displayDate) finalEvent.displayDate = finalEvent.date;

    if (events.find(ev => ev.id === editingEvent.id)) {
      setEvents(events.map(ev => ev.id === editingEvent.id ? finalEvent : ev));
    } else {
      setEvents([...events, finalEvent]);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent({ ...event });
    setIsModalOpen(true);
  };

  const deleteEvent = (id: string) => {
    if (window.confirm('确定要从编年史中抹去这段记载吗？此操作不可撤销。')) {
      setEvents(prev => prev.filter(ev => ev.id !== id));
    }
  };

  const exportAs = async (format: 'jpeg' | 'svg') => {
    if (!timelineRef.current || isExporting) return;
    setIsExporting(true);
    setIsEditingHeader(false);
    try {
      await new Promise(r => setTimeout(r, 600));
      const node = timelineRef.current;
      const options = {
        backgroundColor: '#1a0505',
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: { padding: '150px', overflow: 'visible' }
      };
      let dataUrl = format === 'jpeg' 
        ? await (window as any).htmlToImage.toJpeg(node, { ...options, quality: 0.95 })
        : await (window as any).htmlToImage.toSvg(node, options);
      const link = document.createElement('a');
      link.download = `${mainTitle}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      alert('导出生成失败，请稍后重试。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* 叙事控制面板 */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/60 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] no-print">
        <button onClick={() => setEditingEvent({id:Date.now().toString(),date:'',displayDate:'',title:'',people:'',summary:'',meaning:''}) || setIsModalOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3.5 rounded-2xl font-black transition-all text-sm flex items-center gap-2.5 shadow-[0_0_20px_rgba(217,119,6,0.3)] active:scale-95">
          <i className="fas fa-feather-pointed"></i> 添笔入卷
        </button>
        <button onClick={() => setIsSmartImportOpen(true)} className="bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black transition-all text-sm flex items-center gap-2.5 shadow-[0_0_20px_rgba(5,150,105,0.3)] active:scale-95">
          <i className="fas fa-magic"></i> AI 批量识录
        </button>
        <div className="h-10 w-px bg-white/20 mx-2"></div>
        <button onClick={() => exportAs('jpeg')} className="text-amber-400/70 hover:text-amber-300 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all">导出 JPEG</button>
        <button onClick={() => exportAs('svg')} className="text-amber-400/70 hover:text-amber-300 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all">导出 SVG</button>
      </div>

      {/* 卷轴画布 */}
      <div 
        ref={timelineRef}
        className={`flex-1 relative w-full ${isExporting ? 'p-40' : 'overflow-x-auto pt-64 pb-48 no-scrollbar'}`}
      >
        <div className="min-w-max px-96 flex flex-col justify-center relative min-h-[90vh]">
          
          {/* 主标题 */}
          <div className="mb-48 text-center sticky left-0 z-20">
             <div 
               className="cursor-pointer group inline-block"
               onClick={() => !isExporting && setIsEditingHeader(true)}
             >
               {isEditingHeader && !isExporting ? (
                 <div className="flex flex-col gap-6">
                    <input className="text-[10rem] text-center bg-black/50 border-b-4 border-amber-600 text-amber-500 font-black cursive-font p-8 outline-none rounded-t-3xl" value={mainTitle} onChange={e=>setMainTitle(e.target.value)} onBlur={()=>setIsEditingHeader(false)} autoFocus />
                    <input className="text-4xl text-center bg-transparent text-amber-100/30 font-black tracking-[0.8em] outline-none" value={subTitle} onChange={e=>setSubTitle(e.target.value)} />
                 </div>
               ) : (
                 <>
                   <h1 className="text-[14rem] font-black text-amber-500 cursive-font drop-shadow-[0_25px_30px_rgba(0,0,0,1)] mb-10 transition-all group-hover:scale-[1.03] group-hover:text-amber-400 select-none leading-none">{mainTitle}</h1>
                   <div className="flex items-center justify-center gap-12">
                     <div className="h-[2px] w-40 bg-gradient-to-r from-transparent to-amber-600/40"></div>
                     <p className="text-4xl text-amber-100/20 font-black tracking-[1.2em] uppercase whitespace-nowrap">{subTitle}</p>
                     <div className="h-[2px] w-40 bg-gradient-to-l from-transparent to-amber-600/40"></div>
                   </div>
                 </>
               )}
             </div>
          </div>

          {/* 皇室金轴线条 */}
          <div className="absolute top-1/2 left-0 right-0 h-[6px] z-0 transform -translate-y-1/2 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_4s_infinite]"></div>
          </div>

          {/* 事件节点列表 */}
          <div className="flex items-center gap-56 relative z-10 px-[30rem]">
            {sortedEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={event.id} className={`flex flex-col items-center w-[600px] relative ${isEven ? 'flex-col-reverse' : ''}`}>
                  
                  {/* 事件羊皮纸卡片 */}
                  <div className={`w-full group ${isEven ? 'mb-32' : 'mt-32'}`}>
                    <div 
                      className="gold-border-glow bg-gradient-to-br from-[#3d1a1a] via-[#1a0505] to-[#0d0202] border-2 border-amber-900/40 p-16 rounded-[4rem] shadow-[0_50px_120px_rgba(0,0,0,1)] relative overflow-hidden transform group-hover:-translate-y-8 transition-all duration-700 cursor-pointer"
                      onClick={() => !isExporting && openEditModal(event)}
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] blur-[100px]"></div>
                      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/[0.03] blur-[100px]"></div>
                      
                      <div className="flex justify-between items-end mb-10 relative z-10">
                        <span className="text-amber-500 font-black text-2xl tracking-[0.3em] border-b-2 border-amber-600/40 pb-3">{event.displayDate}</span>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-950/60 border border-amber-500/30 flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                           <i className="fas fa-scroll text-amber-600/80 text-2xl"></i>
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-6xl font-black text-amber-100 mb-8 tracking-tight leading-tight drop-shadow-xl">{event.title}</h3>
                        <div className="mb-10 flex flex-wrap gap-4">
                          <span className="inline-flex items-center gap-3 bg-amber-950/80 text-amber-400 text-sm px-7 py-2.5 rounded-full border border-amber-500/40 font-black tracking-widest uppercase shadow-2xl">
                            <i className="fas fa-user-tie text-xs"></i>
                            {event.people}
                          </span>
                        </div>
                        
                        <div className="mb-8 bg-white/[0.02] p-8 rounded-3xl border border-white/5 shadow-inner">
                           <p className="text-amber-50/80 leading-relaxed text-2xl font-serif">
                             {event.summary}
                           </p>
                        </div>

                        <div className="relative">
                          <i className="fas fa-quote-left absolute -top-4 -left-4 text-amber-800/20 text-6xl"></i>
                          <p className="text-amber-400/70 leading-relaxed text-xl italic font-light font-serif border-l-4 border-amber-900/80 pl-8 py-2 relative z-10">
                            {event.meaning}
                          </p>
                        </div>
                      </div>

                      {!isExporting && (
                        <div className="mt-12 pt-10 border-t border-white/5 flex justify-end gap-10 opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 no-print">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(event); }} className="text-amber-500/30 hover:text-amber-400 transition-colors text-2xl"><i className="fas fa-pen-nib"></i></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} className="text-red-900/40 hover:text-red-600 transition-colors text-2xl"><i className="fas fa-eraser"></i></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`w-[4px] h-32 bg-gradient-to-b ${isEven ? 'from-amber-600/60 to-transparent' : 'from-transparent to-amber-600/60'} absolute left-1/2 -translate-x-1/2 ${isEven ? 'bottom-0' : 'top-0'}`}></div>

                  <div className={`absolute left-1/2 transform -translate-x-1/2 font-black text-amber-500/[0.05] text-[20rem] pointer-events-none select-none z-0 ${isEven ? 'top-full mt-10' : 'bottom-full mb-10'}`}>
                    {event.date.substring(0, 4)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-80 flex items-center gap-24 ml-[35rem] pb-80 opacity-60">
             <div className="h-[3px] w-[45rem] bg-gradient-to-r from-amber-600/80 to-transparent"></div>
             <div className="text-left">
                <p className="text-amber-500 font-black tracking-[1.5em] text-8xl cursive-font mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,1)]">{footerTitle}</p>
                <div className="flex items-center gap-6">
                  <div className="h-[2px] w-16 bg-amber-600/40"></div>
                  <p className="text-amber-100/30 text-xl font-black tracking-[2.5em] uppercase">{footerSub}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* AI 解析弹窗 */}
      {isSmartImportOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 bg-black/98 backdrop-blur-[80px] no-print">
          <div className="bg-[#1e0a0a] border-4 border-emerald-900/30 w-full max-w-6xl rounded-[5rem] shadow-[0_0_200px_rgba(0,0,0,1)] overflow-hidden">
             <div className="px-20 py-16 border-b border-white/5 flex justify-between items-center bg-emerald-950/10">
                <div>
                   <h2 className="text-emerald-400 text-6xl font-black cursive-font tracking-widest">批量史籍智能识录</h2>
                   <p className="text-emerald-700/50 text-base tracking-[0.8em] font-black uppercase mt-4">AI Historical Archive Synthesis</p>
                </div>
                <button onClick={()=>setIsSmartImportOpen(false)} className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center hover:bg-white/5 text-emerald-500 transition-all active:scale-90"><i className="fas fa-times text-4xl"></i></button>
             </div>
             <div className="p-20 space-y-12">
                <textarea 
                  rows={15}
                  className="w-full bg-black/50 border-2 border-emerald-900/30 text-emerald-50/80 rounded-[3.5rem] p-12 outline-none focus:border-emerald-500/60 transition-all text-3xl font-serif leading-relaxed shadow-[inset_0_10px_50px_rgba(0,0,0,0.5)]"
                  placeholder="在此粘贴包含时间、人物、过程及意义的历史段落。AI 将自动分段解析并按轴排版..."
                  value={smartImportText}
                  onChange={e=>setSmartImportText(e.target.value)}
                  disabled={isParsing}
                />
                <button 
                  onClick={handleSmartImport}
                  disabled={isParsing || !smartImportText.trim()}
                  className="w-full py-10 rounded-[2.5rem] bg-emerald-800 hover:bg-emerald-700 text-white font-black text-4xl tracking-[0.8em] shadow-[0_30px_60px_rgba(0,0,0,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-8"
                >
                  {isParsing ? <i className="fas fa-dharmachakra animate-spin"></i> : <i className="fas fa-scroll-old"></i>}
                  {isParsing ? '编撰审定中...' : '启动智能批量识录'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingEvent && isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-12 bg-black/98 backdrop-blur-[100px] no-print">
           <div className="bg-[#180a0a] border-4 border-amber-900/40 w-full max-w-5xl rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,1)] overflow-hidden">
              <div className="px-16 py-12 border-b border-white/5 flex justify-between items-center bg-amber-900/10">
                 <h2 className="text-amber-500 text-5xl font-black cursive-font tracking-widest">档案史料修编</h2>
                 <button onClick={()=>setIsModalOpen(false)} className="text-amber-900 hover:text-amber-500 transition-colors"><i className="fas fa-times text-4xl"></i></button>
              </div>
              <form onSubmit={handleSave} className="p-16 space-y-12">
                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-5">
                      <label className="text-amber-700/60 text-sm font-black uppercase tracking-[0.3em] block pl-3">规范日期 (用于自动排序)</label>
                      <input type="date" required value={editingEvent.date} onChange={e=>setEditingEvent({...editingEvent, date:e.target.value})} className="w-full bg-white/5 border-2 border-white/10 text-amber-50 rounded-[2rem] p-7 outline-none focus:border-amber-600 transition-all text-2xl shadow-inner" />
                   </div>
                   <div className="space-y-5">
                      <label className="text-amber-700/60 text-sm font-black uppercase tracking-[0.3em] block pl-3">卷面日期 (如: 19世纪中期)</label>
                      <input type="text" placeholder="留空则显示标准日期" value={editingEvent.displayDate} onChange={e=>setEditingEvent({...editingEvent, displayDate:e.target.value})} className="w-full bg-white/5 border-2 border-white/10 text-amber-50 rounded-[2rem] p-7 outline-none focus:border-amber-600 transition-all text-2xl shadow-inner" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-5">
                      <label className="text-amber-700/60 text-sm font-black uppercase tracking-[0.3em] block pl-3">核心人物</label>
                      <input type="text" required value={editingEvent.people} onChange={e=>setEditingEvent({...editingEvent, people:e.target.value})} className="w-full bg-white/5 border-2 border-white/10 text-amber-50 rounded-[2rem] p-7 outline-none focus:border-amber-600 transition-all text-2xl shadow-inner" />
                   </div>
                   <div className="space-y-5">
                      <label className="text-amber-700/60 text-sm font-black uppercase tracking-[0.3em] block pl-3">事件定名</label>
                      <input type="text" required value={editingEvent.title} onChange={e=>setEditingEvent({...editingEvent, title:e.target.value})} className="w-full bg-white/5 border-2 border-white/10 text-amber-50 rounded-[2rem] p-7 outline-none focus:border-amber-600 transition-all text-2xl shadow-inner" />
                   </div>
                </div>
                <div className="space-y-5">
                   <label className="text-amber-700/60 text-sm font-black uppercase tracking-[0.3em] block pl-3">事件过程梗概</label>
                   <textarea rows={3} required value={editingEvent.summary} onChange={e=>setEditingEvent({...editingEvent, summary:e.target.value})} className="w-full bg-white/5 border-2 border-white/10 text-amber-50 rounded-[2.5rem] p-8 outline-none focus:border-amber-600 transition-all resize-none font-serif text-2xl leading-relaxed shadow-inner" />
                </div>
                <div className="space-y-5">
                   <label className="text-amber-700/60 text-sm font-black uppercase tracking-[0.3em] block pl-3">历史意义评价</label>
                   <textarea rows={2} required value={editingEvent.meaning} onChange={e=>setEditingEvent({...editingEvent, meaning:e.target.value})} className="w-full bg-white/5 border-2 border-white/10 text-amber-50 rounded-[2.5rem] p-8 outline-none focus:border-amber-600 transition-all resize-none font-serif text-2xl leading-relaxed shadow-inner" />
                </div>
                <button type="submit" className="w-full py-10 rounded-[2.5rem] bg-amber-600 hover:bg-amber-500 text-white font-black text-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] active:scale-[0.99] transition-all">确认并归档入卷</button>
              </form>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .cursive-font { font-family: 'Zhi Mang Xing', cursive; }
        .gold-border-glow { transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);