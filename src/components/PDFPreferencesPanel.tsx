'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface ColorPalette {
  id: string;
  name: string;
  name_fr: string;
  name_ar: string;
  main: string;
  accent: string;
  text_light: string;
  text_dark: string;
  bg_light: string;
  border: string;
}

interface PDFFormat {
  id: string;
  name: string;
}

interface PDFPreferences {
  color_preset: string;
  font_size: string;
  line_height: string;
  available_palettes: ColorPalette[];
  available_fonts: PDFFormat[];
  available_line_heights: PDFFormat[];
}

export function PDFPreferencesPanel() {
  const [preferences, setPreferences] = useState<PDFPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { language } = useLanguage();
  const t = (key: string) => translations[language][key] || translations['fr'][key] || key;

  // Fetch current preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    const token = Cookies.get('access_token');
    try {
      const response = await fetch(`${API_URL}/user/pdf-preferences/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: string) => {
    const token = Cookies.get('access_token');
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/user/pdf-preferences/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
        setMessage({ type: 'success', text: t('preferencesSaved') });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Color Palette Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('colorPalette')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {preferences?.available_palettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => updatePreference('color_preset', palette.id)}
              disabled={saving}
              className={`
                relative p-3 rounded-xl border-2 transition-all
                ${preferences.color_preset === palette.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Selected indicator */}
              {preferences.color_preset === palette.id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {/* Palette name */}
              <p className="font-medium text-gray-900 dark:text-white mb-2 text-sm text-center">
                {language === 'ar' ? palette.name_ar : palette.name_fr}
              </p>
              
              {/* 3-COLOR SWATCH PREVIEW - Matches PDF exactly */}
              <div className="space-y-1">
                {/* Main color (headers/card backgrounds) */}
                <div 
                  className="h-6 rounded-md shadow-sm"
                  style={{ backgroundColor: palette.main }}
                  title={language === 'ar' ? 'اللون الرئيسي' : 'Couleur principale'}
                />
                
                {/* Accent color (highlights/icons) */}
                <div 
                  className="h-4 rounded-md shadow-sm"
                  style={{ backgroundColor: palette.accent }}
                  title={language === 'ar' ? 'لون التمييز' : 'Accent'}
                />
                
                {/* Content card preview (bg_light with text_dark) */}
                <div 
                  className="h-8 rounded-md shadow-sm flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: palette.bg_light, 
                    color: palette.text_dark 
                  }}
                  title={language === 'ar' ? 'محتوى النص' : 'Contenu texte'}
                >
                  Aa
                </div>
              </div>
              
              {/* Color labels */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.main }} />
                  <span>{language === 'ar' ? 'رئيسي' : 'Principal'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.accent }} />
                  <span>{language === 'ar' ? 'تمييز' : 'Accent'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.bg_light }} />
                  <span>{language === 'ar' ? 'خلفية' : 'Fond'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('fontSize')}
        </h3>
        <div className="flex gap-3">
          {preferences?.available_fonts.map((font) => (
            <button
              key={font.id}
              onClick={() => updatePreference('font_size', font.id)}
              disabled={saving}
              className={`
                flex-1 py-3 px-4 rounded-lg border-2 transition-all
                ${preferences.font_size === font.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-gray-900 dark:text-white">{t(font.id) || font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Line Height Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('lineSpacing')}
        </h3>
        <div className="flex gap-3">
          {preferences?.available_line_heights.map((lh) => (
            <button
              key={lh.id}
              onClick={() => updatePreference('line_height', lh.id)}
              disabled={saving}
              className={`
                flex-1 py-3 px-4 rounded-lg border-2 transition-all
                ${preferences.line_height === lh.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              >
              <span className="text-gray-900 dark:text-white">{t(lh.id) || lh.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save message */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
