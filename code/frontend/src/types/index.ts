export interface User {
  id: string;
  fullName: string;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Setting {
  id: string;
  settingName: string;
  toggleState: boolean;
  toggleLocked: boolean;
  inputValue: string;
  inputType: string;
  displayOrder: number;
  versionNum: number;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateSettingPayload {
  toggleState?: boolean;
  inputValue?: string;
  versionNum: number;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  correlationId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
