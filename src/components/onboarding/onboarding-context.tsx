"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Onboarding form data interface
export interface OnboardingFormData {
  // Step 1 - Background & Current Situation
  previousCrm?: string;
  previousCrmOther?: string; // Custom CRM name when "other" is selected
  referralSource?: string;
  teamSize?: string;
  businessFocus?: string[]; // Multi-select
  monthlyListings?: string;
  biggestChallenge?: string[]; // Multi-select

  // Step 2 - Technical Setup
  email?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  hasWebsiteDomain?: boolean;
  websiteDomainName?: string;
  websiteDomainManaged?: boolean;
  hasEmailDomain?: boolean;
  emailDomainName?: string;
  emailDomainManaged?: boolean;

  // Step 3 - Portals & Launch
  usesIdealista?: boolean;
  usesFotocasa?: boolean;
  usesHabitaclia?: boolean;
  additionalNotes?: string;
}

export interface OnboardingState {
  currentStep: number; // 1, 2, or 3
  formData: OnboardingFormData;
  isSubmitting: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function useOnboardingContext(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider",
    );
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    formData: {},
    isSubmitting: false,
  });

  const updateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(Math.max(1, step), 3),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 3),
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setState((prev) => ({
      ...prev,
      isSubmitting: submitting,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      currentStep: 1,
      formData: {},
      isSubmitting: false,
    });
  }, []);

  const contextValue: OnboardingContextType = {
    state,
    updateFormData,
    setCurrentStep,
    nextStep,
    previousStep,
    setSubmitting,
    resetForm,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}
