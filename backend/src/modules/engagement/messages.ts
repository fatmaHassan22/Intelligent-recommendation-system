import {rows,write,type Executor} from '../../db.js';
// Authored messages, selected by verified server context. No remote generator.
export const playfulMessages:Record<string,string[]>={
 TASK_UPCOMING:['الموعد قرب… القهوة تساعد، وخطوة صغيرة تساعد أكثر ☕','مهمتك قرّبت! خلّينا نعطيها موعدًا مع الإنجاز ✨','تذكير لطيف: الموعد جاي، وإنتِ قدّها 🌿'],
 TASK_OVERDUE:['المهمة لسه مستنّياك… نرتّب موعدها من جديد؟ 👀','خطة اليوم ممكن تتغيّر. عدّلي الموعد أو خذي خطوة صغيرة 🌿','المهمة بتلوّح لك من القائمة! خطوة واحدة تكفي للبداية 👋'],
 EVENT_REMINDER:['موعدك الشخصي يناديك! راجعي وقت الحدث في التقويم 📅','التقويم عنده رسالة صغيرة: عندك موعد شخصي 📌','تذكير من رفيق التنظيم: راجعي حدثك ووقته ✨'],
 POMODORO_COMPLETED:['المؤقت وصل! لو كانت جلسة تركيز، وقتك انحفظ. استراحة لطيفة؟ 🍵','رنّ جرس الوقت! خطوة صغيرة أخرى في يومك ⏱️','انتهت الجولة… اختاري خطوتك التالية على راحتك 🌿'],
 GENERAL_REMINDER:['قائمة المهام تنادي بهدوء… اختاري واحدة على قدّ طاقتك 🌱','جلسة صغيرة؟ دماغك يحب البداية الهادية ☕','خطوة اليوم مش لازم تكون كبيرة. مهمة واحدة بتكفي للبداية ✨'],
 ACHIEVEMENT:['شارة جديدة في مجموعتك! إنجاز صغير يستاهل الفرحة 🎉','فتحتي شارة جديدة… مجموعتك صار فيها لمعة زيادة ✨','وصلت شارتك! الشغل الحقيقي يترك أثرًا 🏅'],
 STREAK_MILESTONE:['أيام متواصلة! واضح إنك صرتِ صاحبة الاستمرارية 😎','خطوة كل يوم… السلسلة عم تكبر معك 🌱','محطة جديدة في الاستمرارية! على مهلك، وإنجازك محفوظ ✨']
};
export async function selectMessage(db:Executor,user:string,context:string,normal:string){
 const pref=(await rows(db,'SELECT notification_tone FROM student_engagement_preferences WHERE user_id=?',[user]))[0];
 const library=playfulMessages[context];if(pref?.notification_tone!=='PLAYFUL'||!library)return normal;
 await write(db,'INSERT INTO student_message_history(user_id,context,variant) VALUES(?,?,0) ON DUPLICATE KEY UPDATE variant=MOD(variant+1,?)',[user,context,library.length]);
 const r=(await rows(db,'SELECT variant FROM student_message_history WHERE user_id=? AND context=?',[user,context]))[0];
 return library[Number(r.variant)%library.length]+(context==='EVENT_REMINDER'?' '+normal:'');
}

