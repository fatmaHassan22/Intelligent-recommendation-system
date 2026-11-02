// import Icon from "./Icon";



// type Props = { name: string };

// export default function Logo({ name }: Props) {
//   return (
//     <a href="#top" className="flex items-center gap-2.5 text-[22px] font-bold">
//       <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink text-accent-mint">
//         <Icon name="logo" size={20} />
//       </span>
//       {name}
//     </a>
//   );
// }

import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo(
    { light = false }: { light?: boolean }
) {
    return <Link className={`logo ${light ? 'logo-light' : ''}`} to="/">
        <span className="logo-mark">
            <GraduationCap size={25} />
        </span>
        <span>
            <strong>مسار</strong>
            <small>الدعم الأكاديمي الذكي</small>
        </span>
    </Link>
        ;
}