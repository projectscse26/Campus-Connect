import React, { useState } from 'react';
import axios from 'axios';
import { User, MapPin, Users, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-gray-50 pb-3">
      <Icon className="w-5 h-5 text-primary-500" /> {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
  </div>
);

const Input = ({ label, name, type = 'text', required = false, form, onChange }) => {
  const isNumeric = type === 'tel' || type === 'number';
  
  const handleLocalChange = (e) => {
    if (type === 'tel') {
      const val = e.target.value.replace(/[^0-9+]/g, '');
      onChange({ target: { name: e.target.name, value: val } });
    } else {
      onChange(e);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type === 'tel' ? 'text' : type} 
        inputMode={type === 'tel' ? 'numeric' : (type === 'number' ? 'decimal' : undefined)}
        name={name}
        value={form[name] || ''}
        onChange={handleLocalChange}
        required={required}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
      />
    </div>
  );
};

const Select = ({ label, name, options, required = false, form, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={form[name] || ''}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
    >
      <option value="" disabled>Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const DatalistInput = ({ label, name, options, required = false, form, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      name={name}
      list={`${name}-list`}
      value={form[name] || ''}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
    />
    <datalist id={`${name}-list`}>
      {options.map(opt => (
        <option key={opt} value={opt} />
      ))}
    </datalist>
  </div>
);

export default function OnboardingForm({ profile, onComplete }) {
  const role = profile.role;
  const isStudent = role === 'student';

  const [form, setForm] = useState({
    gender: profile.gender || '',
    date_of_birth: profile.date_of_birth || '',
    blood_group: profile.blood_group || '',
    nationality: profile.nationality || 'Indian',
    community: profile.community || '',
    religion: profile.religion || '',
    address_line1: profile.address_line1 || '',
    address_line2: profile.address_line2 || '',
    city: profile.city || '',
    state: profile.state || '',
    pincode: profile.pincode || '',
    
    // Student specifics
    ...(isStudent ? {
      father_name: profile.father_name || '',
      father_phone: profile.father_phone || '',
      father_occupation: profile.father_occupation || '',
      mother_name: profile.mother_name || '',
      mother_phone: profile.mother_phone || '',
      mother_occupation: profile.mother_occupation || '',
      annual_income: profile.annual_income || '',
      tenth_school: profile.tenth_school || '',
      tenth_board: profile.tenth_board || '',
      tenth_marks: profile.tenth_marks || '',
      tenth_percentage: profile.tenth_percentage || '',
      twelfth_school: profile.twelfth_school || '',
      twelfth_board: profile.twelfth_board || '',
      twelfth_marks: profile.twelfth_marks || '',
      twelfth_percentage: profile.twelfth_percentage || ''
    } : {
      // Faculty specifics
      designation: profile.designation || '',
      qualification: profile.qualification || '',
      specialization: profile.specialization || '',
      experience_years: profile.experience_years || '',
      date_of_joining: profile.date_of_joining || '',
      employment_type: profile.employment_type || 'Permanent'
    })
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await axios.put('/api/auth/profile', form);
      onComplete(); // Triggers reload in parent
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please check the fields.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-500">Please provide the missing details to fully setup your Campus Connect account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {error && (
          <div className="bg-red-50 text-red-700 px-5 py-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 border border-red-100">
            {error}
          </div>
        )}

        <Section title="Personal Information" icon={User}>
          <Select form={form} onChange={handleChange} label="Gender" name="gender" required options={['Male', 'Female', 'Other']} />
          <Input form={form} onChange={handleChange} label="Date of Birth" name="date_of_birth" type="date" required />
          <DatalistInput form={form} onChange={handleChange} label="Blood Group (Select or Type)" name="blood_group" required options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
          <Input form={form} onChange={handleChange} label="Nationality" name="nationality" required />
          <Input form={form} onChange={handleChange} label="Community" name="community" required />
          <Input form={form} onChange={handleChange} label="Religion" name="religion" required />
        </Section>

        <Section title="Address Details" icon={MapPin}>
          <Input form={form} onChange={handleChange} label="Address Line 1" name="address_line1" required />
          <Input form={form} onChange={handleChange} label="Address Line 2" name="address_line2" />
          <Input form={form} onChange={handleChange} label="City" name="city" required />
          <Input form={form} onChange={handleChange} label="State" name="state" required />
          <Input form={form} onChange={handleChange} label="Pincode" name="pincode" required />
        </Section>

        {isStudent && (
          <>
            <Section title="Parent / Guardian Details" icon={Users}>
              <Input form={form} onChange={handleChange} label="Father's Name" name="father_name" required />
              <Input form={form} onChange={handleChange} label="Father's Phone" name="father_phone" type="tel" required />
              <Input form={form} onChange={handleChange} label="Father's Occupation" name="father_occupation" />
              <Input form={form} onChange={handleChange} label="Mother's Name" name="mother_name" required />
              <Input form={form} onChange={handleChange} label="Mother's Phone" name="mother_phone" type="tel" required />
              <Input form={form} onChange={handleChange} label="Mother's Occupation" name="mother_occupation" />
              <Input form={form} onChange={handleChange} label="Annual Income (₹)" name="annual_income" type="number" />
            </Section>

            <Section title="Academic History" icon={GraduationCap}>
              <Input form={form} onChange={handleChange} label="10th School Name" name="tenth_school" required />
              <Input form={form} onChange={handleChange} label="10th Board" name="tenth_board" required />
              <Input form={form} onChange={handleChange} label="10th Total Marks" name="tenth_marks" type="number" required />
              <Input form={form} onChange={handleChange} label="10th Percentage" name="tenth_percentage" type="number" required />
              
              <Input form={form} onChange={handleChange} label="12th / Diploma College" name="twelfth_school" required />
              <Input form={form} onChange={handleChange} label="12th Board" name="twelfth_board" required />
              <Input form={form} onChange={handleChange} label="12th Total Marks" name="twelfth_marks" type="number" required />
              <Input form={form} onChange={handleChange} label="12th Percentage" name="twelfth_percentage" type="number" required />
            </Section>
          </>
        )}

        {!isStudent && (
          <Section title="Professional Details" icon={Briefcase}>
            <Input form={form} onChange={handleChange} label="Designation" name="designation" required />
            <Input form={form} onChange={handleChange} label="Qualification" name="qualification" required />
            <Input form={form} onChange={handleChange} label="Specialization" name="specialization" />
            <Input form={form} onChange={handleChange} label="Years of Experience" name="experience_years" type="number" required />
            <Input form={form} onChange={handleChange} label="Date of Joining" name="date_of_joining" type="date" required />
            <Select form={form} onChange={handleChange} label="Employment Type" name="employment_type" required options={['Permanent', 'Contract', 'Visiting']} />
          </Section>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? 'Saving Profile...' : 'Complete Profile Setup'}
          </button>
        </div>
      </form>
    </div>
  );
}
