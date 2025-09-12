// Data validation utilities and schemas

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export const validators = {
  // Email validation
  email: (email: string): ValidationResult => {
    const errors: string[] = []
    
    if (!email) {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format')
    }

    return { isValid: errors.length === 0, errors }
  },

  // Phone validation
  phone: (phone: string): ValidationResult => {
    const errors: string[] = []
    
    if (!phone) {
      errors.push('Phone number is required')
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      errors.push('Invalid phone number format')
    } else if (phone.replace(/\D/g, '').length < 10) {
      errors.push('Phone number must be at least 10 digits')
    }

    return { isValid: errors.length === 0, errors }
  },

  // Coordinates validation
  coordinates: (lat: number, lng: number): ValidationResult => {
    const errors: string[] = []
    
    if (lat === undefined || lat === null) {
      errors.push('Latitude is required')
    } else if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90')
    }

    if (lng === undefined || lng === null) {
      errors.push('Longitude is required')
    } else if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180')
    }

    return { isValid: errors.length === 0, errors }
  },

  // Address validation
  address: (address: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }): ValidationResult => {
    const errors: string[] = []
    
    if (!address.street) {
      errors.push('Street address is required')
    }

    if (!address.city) {
      errors.push('City is required')
    }

    if (!address.state) {
      errors.push('State is required')
    }

    if (!address.postalCode) {
      errors.push('Postal code is required')
    } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
      errors.push('Invalid postal code format')
    }

    return { isValid: errors.length === 0, errors }
  },

  // Delivery validation
  delivery: (delivery: {
    orderId?: string
    customerId?: string
    pickupLocationId?: string
    deliveryLocationId?: string
    scheduledPickup?: string
    scheduledDelivery?: string
    priority?: string
    packageDetails?: any
  }): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!delivery.orderId) {
      errors.push('Order ID is required')
    }

    if (!delivery.customerId) {
      errors.push('Customer ID is required')
    }

    if (!delivery.pickupLocationId) {
      errors.push('Pickup location is required')
    }

    if (!delivery.deliveryLocationId) {
      errors.push('Delivery location is required')
    }

    if (!delivery.scheduledPickup) {
      errors.push('Scheduled pickup time is required')
    } else {
      const pickupDate = new Date(delivery.scheduledPickup)
      if (pickupDate < new Date()) {
        warnings.push('Pickup time is in the past')
      }
    }

    if (!delivery.scheduledDelivery) {
      errors.push('Scheduled delivery time is required')
    } else if (delivery.scheduledPickup) {
      const pickupDate = new Date(delivery.scheduledPickup)
      const deliveryDate = new Date(delivery.scheduledDelivery)
      if (deliveryDate <= pickupDate) {
        errors.push('Delivery time must be after pickup time')
      }
    }

    if (!delivery.priority) {
      errors.push('Priority is required')
    } else if (!['low', 'medium', 'high', 'urgent'].includes(delivery.priority)) {
      errors.push('Invalid priority level')
    }

    if (delivery.packageDetails) {
      if (!delivery.packageDetails.weight || delivery.packageDetails.weight <= 0) {
        errors.push('Package weight must be greater than 0')
      }

      if (!delivery.packageDetails.dimensions) {
        errors.push('Package dimensions are required')
      } else {
        const { length, width, height } = delivery.packageDetails.dimensions
        if (!length || !width || !height || length <= 0 || width <= 0 || height <= 0) {
          errors.push('All package dimensions must be greater than 0')
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  },

  // Vehicle validation
  vehicle: (vehicle: {
    name?: string
    type?: string
    licensePlate?: string
    capacity?: number
    fuelEfficiency?: number
  }): ValidationResult => {
    const errors: string[] = []

    if (!vehicle.name) {
      errors.push('Vehicle name is required')
    }

    if (!vehicle.type) {
      errors.push('Vehicle type is required')
    } else if (!['truck', 'van', 'motorcycle', 'car'].includes(vehicle.type)) {
      errors.push('Invalid vehicle type')
    }

    if (!vehicle.licensePlate) {
      errors.push('License plate is required')
    } else if (vehicle.licensePlate.length < 3) {
      errors.push('License plate must be at least 3 characters')
    }

    if (!vehicle.capacity || vehicle.capacity <= 0) {
      errors.push('Vehicle capacity must be greater than 0')
    }

    if (vehicle.fuelEfficiency && vehicle.fuelEfficiency <= 0) {
      errors.push('Fuel efficiency must be greater than 0')
    }

    return { isValid: errors.length === 0, errors }
  },

  // Driver validation
  driver: (driver: {
    name?: string
    email?: string
    phone?: string
    licenseNumber?: string
    licenseExpiry?: string
  }): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!driver.name) {
      errors.push('Driver name is required')
    }

    if (driver.email) {
      const emailValidation = validators.email(driver.email)
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors)
      }
    }

    if (!driver.phone) {
      errors.push('Phone number is required')
    } else {
      const phoneValidation = validators.phone(driver.phone)
      if (!phoneValidation.isValid) {
        errors.push(...phoneValidation.errors)
      }
    }

    if (!driver.licenseNumber) {
      errors.push('License number is required')
    }

    if (!driver.licenseExpiry) {
      errors.push('License expiry date is required')
    } else {
      const expiryDate = new Date(driver.licenseExpiry)
      const today = new Date()
      if (expiryDate <= today) {
        errors.push('License has expired')
      } else if (expiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('License expires within 30 days')
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  },

  // Route validation
  route: (route: {
    name?: string
    stops?: any[]
    vehicleId?: string
    driverId?: string
  }): ValidationResult => {
    const errors: string[] = []

    if (!route.name) {
      errors.push('Route name is required')
    }

    if (!route.stops || route.stops.length < 2) {
      errors.push('Route must have at least 2 stops')
    } else if (route.stops.length > 25) {
      errors.push('Route cannot have more than 25 stops')
    }

    if (route.stops) {
      route.stops.forEach((stop, index) => {
        if (!stop.lat || !stop.lng) {
          errors.push(`Stop ${index + 1} must have valid coordinates`)
        }
      })
    }

    return { isValid: errors.length === 0, errors }
  },

  // Date range validation
  dateRange: (startDate: string, endDate: string): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!startDate) {
      errors.push('Start date is required')
    }

    if (!endDate) {
      errors.push('End date is required')
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime())) {
        errors.push('Invalid start date')
      }

      if (isNaN(end.getTime())) {
        errors.push('Invalid end date')
      }

      if (start >= end) {
        errors.push('End date must be after start date')
      }

      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 365) {
        warnings.push('Date range exceeds 1 year')
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  },

  // File validation
  file: (file: File, options: {
    maxSize?: number
    allowedTypes?: string[]
    required?: boolean
  } = {}): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (options.required && !file) {
      errors.push('File is required')
      return { isValid: false, errors }
    }

    if (!file) {
      return { isValid: true, errors }
    }

    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${validators.formatFileSize(options.maxSize!)}`)
    }

    if (options.allowedTypes && !options.allowedTypes.some(type => 
      file.name.toLowerCase().endsWith(type.toLowerCase()) || file.type === type
    )) {
      errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`)
    }

    if (file.size === 0) {
      errors.push('File cannot be empty')
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      warnings.push('Large file size may affect performance')
    }

    return { isValid: errors.length === 0, errors, warnings }
  },

  // Password validation
  password: (password: string): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!password) {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      warnings.push('Password should contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      warnings.push('Password should contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      warnings.push('Password should contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      warnings.push('Password should contain at least one special character')
    }

    return { isValid: errors.length === 0, errors, warnings }
  },

  // Batch validation
  validateBatch: <T>(items: T[], validator: (item: T) => ValidationResult): {
    isValid: boolean
    results: Array<ValidationResult & { index: number }>
    summary: {
      total: number
      valid: number
      invalid: number
      withWarnings: number
    }
  } => {
    const results = items.map((item, index) => ({
      ...validator(item),
      index
    }))

    const valid = results.filter(r => r.isValid).length
    const invalid = results.filter(r => !r.isValid).length
    const withWarnings = results.filter(r => r.warnings && r.warnings.length > 0).length

    return {
      isValid: invalid === 0,
      results,
      summary: {
        total: items.length,
        valid,
        invalid,
        withWarnings
      }
    }
  },

  // Utility functions
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Custom validation
  custom: (value: any, rules: Array<{
    test: (value: any) => boolean
    message: string
    type?: 'error' | 'warning'
  }>): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    rules.forEach(rule => {
      if (!rule.test(value)) {
        if (rule.type === 'warning') {
          warnings.push(rule.message)
        } else {
          errors.push(rule.message)
        }
      }
    })

    return { isValid: errors.length === 0, errors, warnings }
  }
}