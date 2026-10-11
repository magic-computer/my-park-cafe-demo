import React from "react";
import { Clock, AlertTriangle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../Card";
import { InventoryItem, MenuItem } from "../../types";

export interface AiTabProps {
  tText: (key: string, defaultText?: string) => string;
  aiChatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  setAiChatHistory: React.Dispatch<React.SetStateAction<Array<{ role: 'user' | 'assistant'; content: string }>>>;
  aiQuery: string;
  setAiQuery: (query: string) => void;
  inventory: InventoryItem[];
  menuItems: MenuItem[];
}

export const AiTab: React.FC<AiTabProps> = ({
  tText,
  aiChatHistory,
  setAiChatHistory,
  aiQuery,
  setAiQuery,
  inventory,
  menuItems
}) => {
const handleAiInteractionPrompt = (promptText: string) => {
          setAiQuery('');
          setAiChatHistory(prev => [...prev, { role: 'user', content: promptText }]);
          
          // Custom simulated deep thinking block
          setTimeout(() => {
            // Context aware response based on actual low quantities
            const lowStockItems = inventory.filter(i => i.quantity < i.minLevel);
            let responseText = '';
            
            if (promptText.includes('marja') || promptText.includes('marjamı')) {
              responseText = "Məhsul marjanızı optimallaşdırmaq üçün əla fəaliyyət planı hazırladım:\n\n1. **Sezar Salatı** yeməyinin menyu marjası 94.4%-dir ki, bu da olduqca yüksək gəlirlidir. Qiyməti növbəti dövrdə 1₼ artıraraq sərbəst mənfəəti 14% də artıra bilərsiniz.\n2. **Antrikot** yeməyinizin Maya Dəyəri 6.30 ₼-dır. Menyu qiymətiniz isə 25.00 ₼ təşkil edir. Burada marjanız 74.8%-dir. Əslində yaxşı marjadır. Lakin ət tədarükçüsü ilə söhbət edib əti 50 qəpik ucuz alsanız, restoran illik **14,500 ₼** əlavə qabaqcıl təmiz mənfəət əldə edəcək.";
            } else if (promptText.includes('anbar') || promptText.includes('kritik')) {
              if (lowStockItems.length > 0) {
                const names = lowStockItems.map(i => `${i.name} (${i.quantity} ${i.unit} qaldı)`).join(', ');
                responseText = `Hazırda restoranınızın anbarını təhlil etdim. Kritik vəziyyətdə olan inqrediyentlər var: **${names}**. \n\nGələn həftə üçün menyu planlamasını nəzərə alaraq dərhal təchizatçı ilə əlaqə saxlayıb **50kq Un** və **10kq Mozzarella pendiri** sifarişi yerləşdirməyi tövsiyə edirəm.`;
              } else {
                responseText = "Hazırda restoranınızın anbarında bütün maddələr kafi səviyyədədir! Heç bir inqrediyent minimal səviyyədən aşağı deyil. Bu, çox gözəl anbar idarəetməsidir!";
              }
            } else {
              responseText = "Restoran proqnozlarımıza əsasən, həftənin Cümə və Şənbə günləri **Sezar Salatı və Pizzalarda** tələb adi günlərə nisbətən **35% daha çox** gözlənilir. Havanın temperaturu artdığı üçün **Limonad** satışlarında isə rekord olaraq **55% artım** templəri gözlənilir. Masaların doluluq dərəcəsinin isə Pik saatlarda (19:00-21:30) 95%-ə çatacağı təxmin olunur.";
            }

            setAiChatHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
          }, 1500);
        };

        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
              
              {/* Header section with Sparkles */}
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-850 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                    Ağıllı Proqnozlaşdırma və Süni İntellekt Eksperti
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Canlı satışlar, anbar qalıqları və müştəri seçimləri əsasında avtomatlaşdırılmış AI hesabatları.</p>
                </div>
                <span className="bg-orange-50 text-orange-600 font-black text-[10px] px-3 py-1.5 rounded-full border border-orange-200 shadow-xs uppercase tracking-wider">
                  AI ENGINE ACTIVE. v2.4-AZ
                </span>
              </div>

              {/* Bento Grid Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Demand Chart Visual Card */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Gələn Həftə Satış Proqnozu</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mb-4">Süni intellektin təxmin etdiyi günlük ortalama gəlir həcmi.</p>
                  </div>
                  
                  {/* CSS SVG Vertical Graph bars */}
                  <div className="h-32 flex items-end justify-between px-2 gap-2">
                    {[
                      { day: 'B.E', val: 78, price: '1.2k' },
                      { day: 'Ç.A', val: 64, price: '980' },
                      { day: 'Çər', val: 82, price: '1.3k' },
                      { day: 'C.A', val: 55, price: '850' },
                      { day: 'Cüm', val: 95, price: '1.8k', peak: true },
                      { day: 'Şən', val: 120, price: '2.4k', peak: true },
                      { day: 'Baz', val: 105, price: '2.1k', peak: true }
                    ].map(graph => (
                      <div key={graph.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                        <div className="text-[8px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                          {graph.price}₼
                        </div>
                        <div 
                          className={`w-full rounded-t-lg transition-all ${
                            graph.peak 
                              ? 'bg-gradient-to-t from-orange-500 to-amber-500 group-hover:brightness-110 shadow-lg shadow-orange-100' 
                              : 'bg-slate-200 group-hover:bg-slate-350'
                          }`}
                          style={{ height: `${graph.val / 1.2}%` }}
                        />
                        <span className="text-[9px] font-black uppercase text-slate-500 mt-1">{graph.day}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-slate-400 font-bold mt-4 leading-relaxed border-t pt-3">
                    🔮 **AI Təhlili**: Gələn həftəsonu pik doluluq dərəcəsi **Cümə və Şənbə (19:30 - 22:30)** arasında olacaq.
                  </p>
                </Card>

                {/* 2. Inventory Refill AI card */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Ağıllı Tədarük & Satınalma Siyahısı</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mb-4">Ortalama yemək reseptləri israfı əsasında dərhal sifariş tövsiyələri.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-red-50 p-2.5 border border-red-100 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-red-700 leading-none mb-1">UN ehtiyatı azdır!</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Tezliklə 20kq əlavə un alınmalıdır.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-amber-50 p-2.5 border border-amber-100 rounded-xl">
                      <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-slate-700 leading-none mb-1">Mərci Şorbası Yaddaxlanışı</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Tələbə görə pomidor qalığı 2 gün bəs edəcək.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400">Son avtomatlaşdırılmış yoxlanış: 2 dəqiqə əvvəl</span>
                    <button 
                      onClick={() => {
                        alert("Satınalma sifarişi Excel formatında yaradıldı və təchizatçıya (supplier) e-poçtla göndərildi!");
                      }}
                      className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[8px] font-black uppercase hover:bg-orange-600 transition-colors"
                    >
                      Sifarişi Göndər
                    </button>
                  </div>
                </Card>

                {/* 3. Cost reduction expert advice panel */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Menyu Maya Dəyəri Audit Məsləhəti</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mb-4">Gəlirliyi və marjanı maksimuma qaldırmaq üçün AI qeydləri.</p>
                  </div>

                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-2 text-[10px] font-semibold text-slate-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
                      <div>
                        <b className="text-slate-800">Pizza Margherita Marjası:</b> Hazırda un və mozzarella reseptə görə 2.10₼ mal olur. Satış qiymətiniz 12₼-dır. Marjanız möhtəşəm 82.5%-dir.
                      </div>
                    </li>
                    <li className="flex items-start gap-2 text-[10px] font-semibold text-slate-600">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                      <div>
                        <b className="text-slate-800">Antrikot Əti Optimallığı:</b> 350qr qara ət porsiya başına 6.30₼ tutur. İsraf dərəcəsini 3%-dən 2%-ə salsanız, ayda 650₼ qənaət edərsiniz.
                      </div>
                    </li>
                  </ul>

                  <p className="text-[9px] text-emerald-600 font-black border-t pt-3 mt-4 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Ümumi restoran mənfəət artım potensialı: +12%!
                  </p>
                </Card>

              </div>

              {/* Chat Interface row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Visual context stats (1 col) */}
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-150 p-5 flex flex-col gap-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider leading-none mb-1">Ekspert Məlumatı</h4>
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Aktiv Menyu Sayı</p>
                      <p className="text-md font-black text-slate-800">{menuItems.length} ədəd</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Ən Çox Maya Dəyəri Olan</p>
                      <p className="text-md font-black text-slate-800">Antrikot (6.30 ₼)</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Anbar Kafi Dərəcəsi</p>
                      <p className="text-xs font-black bg-green-50 text-green-600 px-2 py-1 rounded inline-block">100% Tamdır</p>
                    </div>
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Suallar üzrə mövzular</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[8px] bg-slate-105 font-bold text-slate-500 px-2 py-0.5 rounded-full">Qiymət</span>
                      <span className="text-[8px] bg-slate-105 font-bold text-slate-500 px-2 py-0.5 rounded-full">İsraf</span>
                      <span className="text-[8px] bg-slate-105 font-bold text-slate-500 px-2 py-0.5 rounded-full">Anbar</span>
                      <span className="text-[8px] bg-slate-105 font-bold text-slate-500 px-2 py-0.5 rounded-full">Marja</span>
                    </div>
                  </div>
                </div>

                {/* AI Chat workspace interface (3 cols) */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-150 p-5 flex flex-col h-[460px] shadow-xs">
                  
                  {/* Chat message listing scroll layout */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
                    {aiChatHistory.map((msg, idx) => {
                      const isAi = msg.role === 'assistant';
                      return (
                        <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                          <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${
                            isAi 
                              ? 'bg-slate-50 border border-slate-100 text-slate-700' 
                              : 'bg-orange-500 text-white shadow-md shadow-orange-100'
                          }`}>
                            <p className="whitespace-pre-line">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Preloaded quick templates help line */}
                  <div className="flex space-x-2 py-2 overflow-x-auto scrollbar-none mb-3 shrink-0">
                    <button 
                      onClick={() => handleAiInteractionPrompt("Yemək marjamı necə artıra bilərəm?")}
                      className="px-3 py-1.5 bg-orange-50 border border-orange-100/70 hover:bg-orange-100/50 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all shrink-0 cursor-pointer"
                    >
                      💡 Menyu marjamı necə yüksəldim?
                    </button>
                    <button 
                      onClick={() => handleAiInteractionPrompt("Kritik anbar vəziyyətləri hansılardır?")}
                      className="px-3 py-1.5 bg-orange-50 border border-orange-100/70 hover:bg-orange-100/50 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all shrink-0 cursor-pointer"
                    >
                      📦 Kritik anbar vəziyyətləri nələrdir?
                    </button>
                    <button 
                      onClick={() => handleAiInteractionPrompt("Gözlənilən Cümə doluluğumu hesablayın")}
                      className="px-3 py-1.5 bg-orange-50 border border-orange-100/70 hover:bg-orange-100/50 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all shrink-0 cursor-pointer"
                    >
                      📈 Pik doluluq və tələb proqnozu
                    </button>
                  </div>

                  {/* Chat footer input bar */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!aiQuery.trim()) return;
                      handleAiInteractionPrompt(aiQuery);
                    }}
                    className="flex gap-2 shrink-0 select-none"
                  >
                    <input 
                      placeholder="Məs. Qiymət marjasını necə optimallaşdıra bilərəm?..." 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-350"
                    />
                    <button 
                      type="submit" 
                      className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-md shadow-orange-100 transition-colors"
                    >
                      Tap
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </div>
        );
};
