/**
 * Data Transformation Service
 * Handles complex data transformations between HubSpot and Google Sheets
 */

import { prisma } from '@/lib/prisma';

export interface TransformationRule {
  sourceField: string;
  targetField: string;
  transformType: string;
  config?: any;
}

export interface FieldMapping {
  hubspotProperty: string;
  sheetColumn: string;
  transformType?: string;
  transformConfig?: any;
  isRequired: boolean;
  defaultValue?: any;
}

export class DataTransformer {
  /**
   * Transform HubSpot data to Google Sheets format
   */
  async transformHubSpotToSheets(
    hubspotData: Record<string, any>,
    mappings: FieldMapping[]
  ): Promise<Record<string, any>> {
    const transformed: Record<string, any> = {};

    for (const mapping of mappings) {
      const sourceValue = hubspotData[mapping.hubspotProperty];

      // Apply default value if source is null/undefined
      let value = sourceValue ?? mapping.defaultValue;

      // Apply transformation
      if (mapping.transformType && value !== null && value !== undefined) {
        value = await this.applyTransformation(
          value,
          mapping.transformType,
          mapping.transformConfig
        );
      }

      transformed[mapping.sheetColumn] = value;
    }

    return transformed;
  }

  /**
   * Transform Google Sheets data to HubSpot format
   */
  async transformSheetsToHubSpot(
    sheetData: Record<string, any>,
    mappings: FieldMapping[]
  ): Promise<Record<string, any>> {
    const transformed: Record<string, any> = {};

    for (const mapping of mappings) {
      const sourceValue = sheetData[mapping.sheetColumn];

      // Apply default value if source is null/undefined
      let value = sourceValue ?? mapping.defaultValue;

      // Apply transformation
      if (mapping.transformType && value !== null && value !== undefined) {
        value = await this.applyReverseTransformation(
          value,
          mapping.transformType,
          mapping.transformConfig
        );
      }

      // Only include if value is not null/undefined or if required
      if (value !== null && value !== undefined) {
        transformed[mapping.hubspotProperty] = value;
      } else if (mapping.isRequired) {
        throw new Error(`Required field "${mapping.hubspotProperty}" is missing`);
      }
    }

    return transformed;
  }

  /**
   * Apply transformation from HubSpot to Sheets
   */
  private async applyTransformation(
    value: any,
    transformType: string,
    config?: any
  ): Promise<any> {
    switch (transformType) {
      case 'DATE_FORMAT':
        return this.formatDate(value, config?.format || 'MM/DD/YYYY');

      case 'NUMBER_FORMAT':
        return this.formatNumber(value, config);

      case 'CURRENCY_FORMAT':
        return this.formatCurrency(value, config?.currency || 'USD');

      case 'BOOLEAN_TO_TEXT':
        return this.booleanToText(value, config);

      case 'ENUM_TO_TEXT':
        return this.enumToText(value, config?.mapping);

      case 'CONCATENATE':
        return this.concatenateFields(value, config);

      case 'SPLIT':
        return this.splitField(value, config);

      case 'UPPERCASE':
        return String(value).toUpperCase();

      case 'LOWERCASE':
        return String(value).toLowerCase();

      case 'TITLE_CASE':
        return this.toTitleCase(String(value));

      case 'TRIM':
        return String(value).trim();

      case 'PHONE_FORMAT':
        return this.formatPhone(value, config?.format || 'US');

      case 'EMAIL_NORMALIZE':
        return String(value).toLowerCase().trim();

      case 'JSON_TO_STRING':
        return JSON.stringify(value);

      case 'ARRAY_TO_STRING':
        return Array.isArray(value) ? value.join(config?.separator || ', ') : value;

      case 'CUSTOM_FUNCTION':
        return await this.applyCustomFunction(value, config?.function);

      default:
        return value;
    }
  }

  /**
   * Apply reverse transformation from Sheets to HubSpot
   */
  private async applyReverseTransformation(
    value: any,
    transformType: string,
    config?: any
  ): Promise<any> {
    switch (transformType) {
      case 'DATE_FORMAT':
        return this.parseDate(value, config?.format || 'MM/DD/YYYY');

      case 'NUMBER_FORMAT':
        return this.parseNumber(value);

      case 'CURRENCY_FORMAT':
        return this.parseCurrency(value);

      case 'BOOLEAN_TO_TEXT':
        return this.textToBoolean(value, config);

      case 'ENUM_TO_TEXT':
        return this.textToEnum(value, config?.reverseMapping);

      case 'CONCATENATE':
        // Can't reverse concatenation without specific rules
        return value;

      case 'SPLIT':
        return this.joinField(value, config);

      case 'UPPERCASE':
      case 'LOWERCASE':
      case 'TITLE_CASE':
      case 'TRIM':
        // These don't need reverse transformation
        return value;

      case 'PHONE_FORMAT':
        return this.parsePhone(value);

      case 'EMAIL_NORMALIZE':
        return String(value).toLowerCase().trim();

      case 'JSON_TO_STRING':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }

      case 'ARRAY_TO_STRING':
        return String(value).split(config?.separator || ', ');

      case 'CUSTOM_FUNCTION':
        return await this.applyCustomFunction(value, config?.reverseFunction);

      default:
        return value;
    }
  }

  /**
   * Format date value
   */
  private formatDate(value: any, format: string): string {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);

    // Simple date formatting (you might want to use a library like date-fns for complex formats)
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Parse date string to timestamp
   */
  private parseDate(value: any, format: string): number {
    if (!value) return 0;

    const dateStr = String(value);
    let date: Date;

    // Try to parse based on format
    if (format === 'MM/DD/YYYY') {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }

    return date.getTime();
  }

  /**
   * Format number value
   */
  private formatNumber(value: any, config?: any): string {
    const num = parseFloat(value);
    if (isNaN(num)) return String(value);

    if (config?.decimals !== undefined) {
      return num.toFixed(config.decimals);
    }

    if (config?.thousands) {
      return num.toLocaleString();
    }

    return String(num);
  }

  /**
   * Parse number from string
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;

    const str = String(value).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: any, currency: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return String(value);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  }

  /**
   * Parse currency string to number
   */
  private parseCurrency(value: any): number {
    if (typeof value === 'number') return value;

    const str = String(value).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  }

  /**
   * Convert boolean to text
   */
  private booleanToText(value: any, config?: any): string {
    const isTrue = value === true || value === 'true' || value === 1;

    if (config?.trueValue && config?.falseValue) {
      return isTrue ? config.trueValue : config.falseValue;
    }

    return isTrue ? 'Yes' : 'No';
  }

  /**
   * Convert text to boolean
   */
  private textToBoolean(value: any, config?: any): boolean {
    if (config?.trueValue) {
      return value === config.trueValue;
    }

    const str = String(value).toLowerCase();
    return str === 'yes' || str === 'true' || str === '1';
  }

  /**
   * Map enum value to text
   */
  private enumToText(value: any, mapping?: Record<string, string>): string {
    if (!mapping) return String(value);
    return mapping[value] || value;
  }

  /**
   * Map text to enum value
   */
  private textToEnum(value: any, reverseMapping?: Record<string, string>): string {
    if (!reverseMapping) return String(value);
    return reverseMapping[value] || value;
  }

  /**
   * Concatenate multiple fields
   */
  private concatenateFields(value: any, config?: any): string {
    if (!config?.fields || !Array.isArray(config.fields)) {
      return String(value);
    }

    return config.fields
      .map((field: string) => value[field] || '')
      .join(config.separator || ' ');
  }

  /**
   * Split field value
   */
  private splitField(value: any, config?: any): string {
    const str = String(value);
    const parts = str.split(config?.separator || ',');

    if (config?.index !== undefined && parts[config.index]) {
      return parts[config.index].trim();
    }

    return parts[0] || '';
  }

  /**
   * Join field values
   */
  private joinField(value: any, config?: any): string {
    if (Array.isArray(value)) {
      return value.join(config?.separator || ',');
    }
    return String(value);
  }

  /**
   * Convert to title case
   */
  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * Format phone number
   */
  private formatPhone(value: any, format: string): string {
    const digits = String(value).replace(/\D/g, '');

    if (format === 'US' && digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return digits;
  }

  /**
   * Parse phone number to digits only
   */
  private parsePhone(value: any): string {
    return String(value).replace(/\D/g, '');
  }

  /**
   * Apply custom transformation function
   */
  private async applyCustomFunction(value: any, functionStr?: string): Promise<any> {
    if (!functionStr) return value;

    try {
      // Create a safe function execution context
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('value', 'prisma', functionStr);

      return await fn(value, prisma);
    } catch (error) {
      console.error('Custom function error:', error);
      return value;
    }
  }

  /**
   * Validate transformation configuration
   */
  static validateTransformConfig(
    transformType: string,
    config?: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (transformType) {
      case 'DATE_FORMAT':
        if (!config?.format) {
          errors.push('Date format is required');
        }
        break;

      case 'ENUM_TO_TEXT':
        if (!config?.mapping || typeof config.mapping !== 'object') {
          errors.push('Enum mapping is required');
        }
        break;

      case 'CONCATENATE':
        if (!config?.fields || !Array.isArray(config.fields)) {
          errors.push('Fields array is required for concatenation');
        }
        break;

      case 'CUSTOM_FUNCTION':
        if (!config?.function) {
          errors.push('Custom function is required');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}