# **App Name**: Heavy Duty Checklist

## Core Features:

- Operator Login: Login page for operators/drivers with fields for NIK, name, vehicle number, vehicle type, and location. Provides access to the operator checklist upon successful login.
- Daily Checklist Form: Daily checklist form with items for engine oil level, hydraulic oil level, radiator water level, battery water level, brake fluid level, transmission fluid level, air filter cleanliness, tire pressure, grease and bearing lubrication, cabin cleanliness, dump truck/bucket cleanliness, rearview mirror condition and backup alarm functionality.
- Condition Selectors with Details: For each checklist item, provide 'OK', 'DAMAGED', and 'NEEDS ATTENTION' radio button options, defaulting to 'OK'.  Conditionally display a text area and image upload field if 'DAMAGED' or 'NEEDS ATTENTION' is selected. Include camera integration.
- Other Damage Details: Provide a text field and image upload field for the 'Other damage' checklist item.
- Unified Login with Role Redirection: Implement single sign-on capability, differentiating roles (admin/operator) via login credentials to redirect to appropriate dashboards.

## Style Guidelines:

- Primary color: Medium blue (#42A5F5) to evoke reliability and professionalism, fitting for industrial equipment management.
- Background color: Light gray (#F5F5F5), providing a neutral backdrop to ensure readability and focus on the checklist items.
- Accent color: Yellow-orange (#FFB74D) for highlighting important actions and alerts.
- Body and headline font: 'Inter', a sans-serif font that is both modern and easily readable, for clear display of checklist items and instructions.
- Use clear, industry-standard icons for checklist items, focusing on recognizability rather than overly detailed designs.
- Maintain a clean, single-column layout optimized for mobile use, ensuring ease of input for operators in the field.
- Subtle transitions for displaying additional input fields upon selecting 'DAMAGED' or 'NEEDS ATTENTION'.