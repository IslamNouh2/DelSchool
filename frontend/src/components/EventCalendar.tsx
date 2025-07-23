"use client"

import Image from "next/image";
import { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';


type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const events = [
    {
        id: 1,
        title: "Lorem Ipsum is simply",
        time: "12:00 PM - 06:00 PM",
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting "
    },
    {
        id: 2,
        title: "Lorem Ipsum is simply",
        time: "04:00 PM - 10:00 PM",
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
    },
    {
        id: 3,
        title: "Lorem Ipsum is simply",
        time: "12:00 AM - 04:00 AM",
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
    },
]

const EventCalendar = () => {
    const [value, onChange] = useState<Value>(new Date());
    return (
        <div className='bg-white rounded-md p-4'>
            <Calendar onChange={onChange} value={value} />
            <div className="flex gap-4 flex-col">
                <div className="flex justify-between items-center">
                    <h1 className="font-semibold py-4 text-xl">event</h1>
                    <Image src="/MoreDark.png" alt="" width={20} height={20} className="cursor-pointer"/>
                </div>
                {events.map(event => (
                    <div
                        className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
                        key={event.id}
                    >
                        <div className="flex items-center justify-between">
                            <h1 className="font-semibold text-gray-600">{event.title}</h1>
                            <span className="text-xs text-gray-300">{event.time}</span>
                        </div>
                        <p className="text-sm text-gray-400">{ event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default EventCalendar