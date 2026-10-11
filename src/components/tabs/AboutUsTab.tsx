import React from "react";
import { 
  Phone, 
  Globe, 
  Sparkles, 
  Laptop, 
  ExternalLink, 
  Mail 
} from "lucide-react";
import { Card } from "../Card";

export interface AboutUsTabProps {
  tText: (key: string, defaultText?: string) => string;
  devName: string;
  devRole?: string;
  devBio: string;
  devPhone: string;
  devEmail: string;
  devWhatsapp?: string;
  appLanguage?: string;
  devGithub?: string;
  devLinkedin?: string;
  devPrograms?: any;
  devWebsite: string;
  devLogoUrl: string;
  devTechnologies?: string[];
  devExperienceYears?: string;
  devProjectsCount?: string;
  devSatisfactionRate?: string;
  appNameWord1: string;
  appNameWord2: string;
}

export const AboutUsTab: React.FC<AboutUsTabProps> = ({
  tText,
  devName,
  devRole = "Full Stack Developer & POS Architect",
  devBio,
  devPhone,
  devEmail,
  devWhatsapp = "",
  appLanguage = "az",
  devGithub = "",
  devLinkedin = "",
  devPrograms = [],
  devWebsite,
  devLogoUrl,
  devTechnologies = ["TypeScript", "React", "Tailwind CSS", "Node.js"],
  devExperienceYears = "7+",
  devProjectsCount = "50+",
  devSatisfactionRate = "100%",
  appNameWord1,
  appNameWord2
}) => {
return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
            
            {/* Developer Card Header Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                {/* Avatar / Profile picture */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-indigo-500/20 shadow-xl bg-slate-800">
                    <img 
                      src={devLogoUrl} 
                      alt={devName} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full border-2 border-slate-950 shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    AKTİV
                  </span>
                </div>
                
                {/* Intro details */}
                <div className="text-center md:text-left space-y-3 flex-1">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30">
                    SİSTEM TƏRTİBATÇISI / PROQRAMÇI
                  </span>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight">{devName}</h1>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed max-w-2xl">
                    {devBio}
                  </p>
                  
                  {/* Contact fast-actions */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                    <a
                      href={`https://wa.me/${devWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/10 flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.115.95 11.999.95c-5.44 0-9.866 4.372-9.87 9.802 0 1.81.504 3.512 1.46 5.013l-.959 3.506 3.606-.947zm11.367-7.835c-.31-.155-1.837-.894-2.12-.995-.283-.102-.49-.153-.696.155-.207.309-.799.995-.98 1.19-.18.2-.362.227-.672.072-.31-.155-1.31-.476-2.497-1.518-.923-.81-1.545-1.81-1.726-2.115-.181-.31-.019-.477.136-.631.14-.14.31-.355.465-.53.155-.18.207-.309.31-.515.103-.207.052-.387-.026-.54-.078-.155-.696-1.65-.954-2.26-.25-.595-.503-.514-.696-.524-.18-.01-.387-.01-.593-.01-.205 0-.54.077-.824.385-.283.31-1.082 1.05-1.082 2.561 0 1.51 1.133 2.977 1.288 3.18.155.207 2.21 3.325 5.355 4.654.747.316 1.332.505 1.787.65.753.235 1.438.201 1.982.12.606-.09 1.837-.738 2.095-1.45.258-.713.258-1.325.18-1.45-.077-.123-.283-.2-.593-.355z"/>
                      </svg>
                      {appLanguage === 'AZ' ? 'WhatsApp İlə Yaz' : 'WhatsApp'}
                    </a>
                    
                    <a
                      href={`tel:${devPhone}`}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {devPhone}
                    </a>

                    {devEmail && (
                      <a
                        href={`mailto:${devEmail}`}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {devEmail}
                      </a>
                    )}

                    <a
                      href={devWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Veb Portfeli
                    </a>

                    {devGithub && (
                      <a
                        href={devGithub}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1"
                      >
                        GitHub
                      </a>
                    )}

                    {devLinkedin && (
                      <a
                        href={devLinkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Program Portfolios Showcase Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">İşçi Portfoliom və Proqramlarım</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sizin biznesinizə sürət və gəlir qazandıracaq peşəkar tətbiqlər</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
                    {devPrograms.length} Aktiv Layihə
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devPrograms.map((program) => (
                  <div key={program.id} className="bg-white rounded-3xl border border-slate-150/75 shadow-3xs overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all group">
                    {/* Program Image Preview */}
                    <div className="h-44 bg-slate-900 relative overflow-hidden shrink-0">
                      <img 
                        src={program.image} 
                        alt={program.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                      
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <span className="bg-orange-500 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-lg tracking-wider">
                          PORTFOLİO
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">{program.name}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
                          {program.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {/* Technologies Tags */}
                        <div className="flex flex-wrap gap-1">
                          {program.tech.split(',').map((techItem, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-500 font-bold text-[8.5px] uppercase px-2 py-0.5 rounded-md">
                              {techItem.trim()}
                            </span>
                          ))}
                        </div>

                        {/* Demo/Go button */}
                        {program.link && program.link !== '#' && (
                          <a
                            href={program.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 group-hover:border-indigo-600 font-extrabold text-[10px] uppercase w-full py-2.5 rounded-xl block text-center tracking-wider transition-all flex items-center justify-center gap-1"
                          >
                            <span>LAYİHƏYƏ BAX</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Standard badge / system confirmation card */}
            <div className="p-6 bg-slate-100 border border-slate-200 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500 text-white rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Özəl sifarişli proqramlaşdırma xidməti</h5>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">Sizin ideyanız, bizim peşəkar, sürətli və zəmanətli kodlaşdırmamız!</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${devWhatsapp}?text=Salam,%20yeni%20proqram%20layihəsi%20sifarişi%20vermək%20istəyirəm.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest text-[10px] uppercase px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-100 transition-all flex items-center gap-1.5 shrink-0"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.115.95 11.999.95c-5.44 0-9.866 4.372-9.87 9.802 0 1.81.504 3.512 1.46 5.013l-.959 3.506 3.606-.947zm11.367-7.835c-.31-.155-1.837-.894-2.12-.995-.283-.102-.49-.153-.696.155-.207.309-.799.995-.98 1.19-.18.2-.362.227-.672.072-.31-.155-1.31-.476-2.497-1.518-.923-.81-1.545-1.81-1.726-2.115-.181-.31-.019-.477.136-.631.14-.14.31-.355.465-.53.155-.18.207-.309.31-.515.103-.207.052-.387-.026-.54-.078-.155-.696-1.65-.954-2.26-.25-.595-.503-.514-.696-.524-.18-.01-.387-.01-.593-.01-.205 0-.54.077-.824.385-.283.31-1.082 1.05-1.082 2.561 0 1.51 1.133 2.977 1.288 3.18.155.207 2.21 3.325 5.355 4.654.747.316 1.332.505 1.787.65.753.235 1.438.201 1.982.12.606-.09 1.837-.738 2.095-1.45.258-.713.258-1.325.18-1.45-.077-.123-.283-.2-.593-.355z"/>
                </svg>
                YENİ PROQRAM SİFARİŞ ET
              </a>
            </div>

          </div>
        </div>
      );
};
