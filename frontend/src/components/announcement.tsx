"use client"

const Announcement = () => {
    return (
        <div className='bg-white rounded-md p-4'>
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Announcements</h1>
                <span className="text-xs text-gray-400 cursor-pointer">View All</span>
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-lamaSkyLight rounded-md p-4">
                    <div className="flex items-center justify-between">
                        <h1 className="font-medium">Lorem Ipsum is simple</h1>
                        <span className="text-xs text-gray-400 bg-white py-1 px-1 rounded-md">2025/12/25</span>
                    </div>
                    <p className="text-xs text-gray-500 mt1-2">Lorem Ipsum is simply dummy text of the printing and typesetting industry</p>
                </div>
                <div className="bg-lamaYellowLight rounded-md p-4">
                    <div className="flex items-center justify-between">
                        <h1 className="font-medium">Lorem Ipsum is simple</h1>
                        <span className="text-xs text-gray-400 bg-white py-1 px-1 rounded-md">2025/12/25</span>
                    </div>
                    <p className="text-xs text-gray-500 mt1-2">Lorem Ipsum is simply dummy text of the printing and typesetting industry</p>
                </div>
                <div className="bg-lamaPurpleLight rounded-md p-4">
                    <div className="flex items-center justify-between">
                        <h1 className="font-medium">Lorem Ipsum is simple</h1>
                        <span className="text-xs text-gray-400 bg-white py-1 px-1 rounded-md">2025/12/25</span>
                    </div>
                    <p className="text-xs text-gray-500 mt1-2">Lorem Ipsum is simply dummy text of the printing and typesetting industry</p>
                </div>
            </div>
            
        </div>
    )
}

export default Announcement