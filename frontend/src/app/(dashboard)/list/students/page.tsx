"use client";

import React, { useState, useEffect } from 'react';
import CardList from '@/components/CardList';
import StudentForm from '@/components/forms/StudentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Student {
    studentId: number;
    firstName: string;
    lastName: string;
    email?: string;
    photoUrl?: string | null;
    gender: string;
    dateOfBirth: string;
    // Add other fields as needed
}

interface StudentsResponse {
    students: Student[];
    total: number;
    page: number;
    totalPages: number;
}

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const studentsPerPage = 12;

    // Fetch students
    const fetchStudents = async (page: number = 1, search: string = '') => {
        try {
            setLoading(page === 1);

            const endpoint = search.trim()
                ? `/student/search?name=${encodeURIComponent(search)}&page=${page}&limit=${studentsPerPage}`
                : `/student/list?page=${page}&limit=${studentsPerPage}`;

            const response = await api.get<StudentsResponse>(endpoint, {
                withCredentials: true,
            });

            const { students, total, totalPages } = response.data;

            setStudents(students);
            setTotalStudents(total);
            setTotalPages(totalPages);
            setCurrentPage(page);

        } catch (error: any) {
            console.error('Error fetching students:', error);
            //toast.error('Failed to load students');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchStudents(1, searchTerm);
    }, []);

    // Search handler with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== '') {
                fetchStudents(1, searchTerm);
            } else {
                fetchStudents(1);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStudents(currentPage, searchTerm);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchStudents(newPage, searchTerm);
        }
    };

    const handleStudentDeleted = () => {
        // Refresh current page or go to previous page if current becomes empty
        const newTotal = totalStudents - 1;
        const newTotalPages = Math.ceil(newTotal / studentsPerPage);

        if (currentPage > newTotalPages && newTotalPages > 0) {
            fetchStudents(newTotalPages, searchTerm);
        } else {
            fetchStudents(currentPage, searchTerm);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header + Search Container */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Students</h1>
                        <p className="text-gray-500">
                            {totalStudents} student{totalStudents !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {/* Top Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2">
                            <Button
                                onClick={handleRefresh}
                                variant="outline"
                                size="sm"
                                disabled={refreshing}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>

                            <Button onClick={() => setShowCreateForm(true)} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Student
                            </Button>
                        </div>

                        {/* Bottom Buttons (Filter + Sort) */}
                        <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-2">
                            <Button variant="outline" size="sm">
                                Filter
                            </Button>
                            <Button variant="outline" size="sm">
                                Sort
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Search students by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Students Grid */}
            {students.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {students.map((student) => (
                            <CardList
                                key={student.studentId}
                                studentId={student.studentId}
                                firstName={student.firstName}
                                lastName={student.lastName}
                                email={student.email}
                                photoUrl={student.photoUrl}
                                onDelete={handleStudentDeleted}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                            <Button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                variant="outline"
                                size="sm"
                            >
                                Previous
                            </Button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            className="w-10"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                variant="outline"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first student.'}
                    </p>
                    {!searchTerm && (
                        <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Student
                        </Button>
                    )}
                </div>
            )}

            {/* Create Form Modal */}
            {showCreateForm && (
                <StudentForm
                    type="create"
                    setOpen={setShowCreateForm}
                    onSuccess={() => {
                        fetchStudents(1, searchTerm); // Refresh list after creation
                    }}
                />
            )}
        </div>
    );
};

export default StudentsPage;