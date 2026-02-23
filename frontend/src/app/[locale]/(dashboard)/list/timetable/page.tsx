// import BigCalender from "@/components/BigCalender";
// import AdminTimetable from "@/components/TimetableAdmin";

import TimetableCalendar from "@/components/Timetable";


// export default function TimetablePage() {
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-6">Gestion des Emplois du Temps</h1>
//             {/* <AdminTimetable /> */}
//             <BigCalender/>
//         </div>
//     )
// }


export default function Page() {
    return (
        <div className="p-4">
            {/* <h1 className="text-2xl font-semibold mb-4">School Timetable</h1> */}
            <TimetableCalendar />
        </div>
    );
}
