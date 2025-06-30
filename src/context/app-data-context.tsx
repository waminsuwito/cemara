
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import { initialUsers, initialVehicles, initialReports, User, Vehicle, Report } from '@/lib/data';
import { isSameDay } from 'date-fns';

type AppDataContextType = {
  users: User[];
  vehicles: Vehicle[];
  reports: Report[];
  submitReport: (report: Omit<Report, 'id' | 'timestamp'>) => void;
  // We can add functions for users and vehicles later
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [reports, setReports] = useState<Report[]>(initialReports);

  const submitReport = (newReportData: Omit<Report, 'id' | 'timestamp'>) => {
    const timestamp = Date.now();
    const newReport: Report = {
      ...newReportData,
      id: String(timestamp),
      timestamp,
    };

    setReports(prevReports => {
      const today = new Date();
      // Find if a report for this vehicle was already submitted today
      const existingReportIndex = prevReports.findIndex(
        (r) => r.vehicleId === newReport.vehicleId && isSameDay(new Date(r.timestamp), today)
      );

      if (existingReportIndex !== -1) {
        // If it exists, replace it with the new one
        const updatedReports = [...prevReports];
        updatedReports[existingReportIndex] = newReport;
        return updatedReports;
      } else {
        // Otherwise, add the new report
        return [...prevReports, newReport];
      }
    });
  };

  const value = {
    users,
    vehicles,
    reports,
    submitReport,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
