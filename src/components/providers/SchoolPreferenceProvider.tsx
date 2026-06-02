"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SCHOOLS, getSchoolByName } from "@/src/lib/schools";

const STORAGE_KEY = "copa-apdes-selected-school";
const ALL_SCHOOLS_VALUE = "__all__";

type SchoolPreferenceContextType = {
  selectedSchool: string | null;
  hasSelectedSchool: boolean;
  hasPreference: boolean;
  viewingAllSchools: boolean;
  ready: boolean;
  setSelectedSchool: (school: string) => void;
  setAllSchools: () => void;
  clearSelectedSchool: () => void;
};

const SchoolPreferenceContext = createContext<SchoolPreferenceContextType | null>(null);

export function SchoolPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [selectedSchool, setSelectedSchoolState] = useState<string | null>(null);
  const [viewingAllSchools, setViewingAllSchools] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === ALL_SCHOOLS_VALUE) {
      setSelectedSchoolState(null);
      setViewingAllSchools(true);
      setReady(true);
      return;
    }

    const school = stored ? getSchoolByName(stored) : null;
    setSelectedSchoolState(school?.name ?? null);
    setViewingAllSchools(false);
    setReady(true);
  }, []);

  const setSelectedSchool = useCallback((school: string) => {
    const normalizedSchool = getSchoolByName(school)?.name ?? school;
    setSelectedSchoolState(normalizedSchool);
    setViewingAllSchools(false);
    window.localStorage.setItem(STORAGE_KEY, normalizedSchool);
  }, []);

  const setAllSchools = useCallback(() => {
    setSelectedSchoolState(null);
    setViewingAllSchools(true);
    window.localStorage.setItem(STORAGE_KEY, ALL_SCHOOLS_VALUE);
  }, []);

  const clearSelectedSchool = useCallback(() => {
    setSelectedSchoolState(null);
    setViewingAllSchools(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasSelectedSchool = SCHOOLS.some((school) => school.name === selectedSchool);
  const hasPreference = hasSelectedSchool || viewingAllSchools;

  const value = useMemo(
    () => ({
      selectedSchool,
      hasSelectedSchool,
      hasPreference,
      viewingAllSchools,
      ready,
      setSelectedSchool,
      setAllSchools,
      clearSelectedSchool,
    }),
    [
      clearSelectedSchool,
      hasPreference,
      hasSelectedSchool,
      ready,
      selectedSchool,
      setAllSchools,
      setSelectedSchool,
      viewingAllSchools,
    ],
  );

  return <SchoolPreferenceContext.Provider value={value}>{children}</SchoolPreferenceContext.Provider>;
}

export function useSchoolPreference() {
  const context = useContext(SchoolPreferenceContext);
  if (!context) throw new Error("useSchoolPreference debe usarse dentro de SchoolPreferenceProvider.");
  return context;
}
