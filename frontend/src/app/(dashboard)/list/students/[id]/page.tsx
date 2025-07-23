import Announcement from "@/components/announcement"
import BigCalender from "@/components/BigCalender"
import Performance from "@/components/Performance"
import Image from "next/image"
import Link from "next/link"


const SingleStudentPage = () => {
    return (
        <div className='flex-1 p-4 flex flex-col gap-4 xl:flex-row'>
            {/* LEFT */}
            <div className="w-full xl:w-2/3">
                {/* TOP */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* USER INFO CARD */}
                    <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
                        <div className="w-1/3">
                            <Image
                                src="https://images.pexels.com/photos/1007066/pexels-photo-1007066.jpeg?auto=compress&cs=tinysrgb&w=600"
                                alt="/" width={144} height={144}
                                className="w-36 h-36 rounded-full object-cover" />
                        </div>
                        <div className="w-3/3 flex flex-col justify-between gap-4">
                            <h3 className="text-xl font-semibold">Lorem ipsum</h3>
                            <p className="text-sm text-gray-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit. S.</p>
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <Image src="/blood.png" alt="/" width={14} height={14} />
                                    <span>O+</span>
                                </div>
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <Image src="/date.png" alt="/" width={14} height={14} />
                                    <span>16/02/2024</span>
                                </div>
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <Image src="/mail.png" alt="/" width={14} height={14} />
                                    <span>idskd@gmail.com</span>
                                </div>
                                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                                    <Image src="/phone.png" alt="/" width={14} height={14} />
                                    <span>+213662094729</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* SMALL CARD */}
                    <div className="flex-1 flex flex-wrap justify-between gap-4">
                        {/* CARD */}
                        <div className="bg-white flex p-4 gap-4 w-full rounded-md md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <Image src="/singleAttendance.png" alt="" width={24} height={24} className="w-6 h-6" />
                            <div>
                                <h1 className="text-xl font-semibold">41%</h1>
                                <span className="text-sm text-gray-400">Attendance</span>
                            </div>
                        </div>
                        <div className="bg-white flex p-4 gap-4 w-full rounded-md md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <Image src="/singleBranch.png" alt="" width={24} height={24} className="w-6 h-6" />
                            <div>
                                <h1 className="text-xl font-semibold">2</h1>
                                <span className="text-sm text-gray-400">Branchs</span>
                            </div>
                        </div>
                        <div className="bg-white flex p-4 gap-4 w-full rounded-md md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <Image src="/singleLesson.png" alt="" width={24} height={24} className="w-6 h-6" />
                            <div>
                                <h1 className="text-xl font-semibold">4</h1>
                                <span className="text-sm text-gray-400">Lesson</span>
                            </div>
                        </div>
                        <div className="bg-white flex p-4 gap-4 w-full rounded-md md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                            <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
                            <div>
                                <h1 className="text-xl font-semibold">2</h1>
                                <span className="text-sm text-gray-400">Classes</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* BOTTOM */}
                <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
                    <h1>Student&apos;s Calender</h1>
                    <BigCalender />
                </div>
            </div>
            {/* RIGHT */}
            <div className="w-full xl:w-1/3 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-md ">
                    <h1 className="font-semibold text-xl">ShortCut</h1>
                    <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-400">
                        <Link className="p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple" href="/"> Student&apos;s Calender </Link>
                        <Link className="p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky" href="/"> Student&apos;s Class </Link>
                        <Link className="p-3 rounded-md bg-lamaYellowLight hover:bg-lamaYellow" href="/"> Student&apos;s Lesson </Link>
                        <Link className="p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple" href="/"> Student&apos;s Student </Link>
                    </div>
                </div>
                <Performance />
                <Announcement />
            </div>
        </div>
    )
}

export default SingleStudentPage