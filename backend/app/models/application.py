from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ApplicationStatus = Literal[
    "applied",
    "screening",
    "interview",
    "offer",
    "onboarding",
    "active",
    "rejected",
]


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    status: ApplicationStatus = "applied"
    applied_date: date | None = None

    @field_validator("company", "role")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class ApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=200)
    status: ApplicationStatus | None = None
    applied_date: date | None = None

    @field_validator("company", "role")
    @classmethod
    def strip_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @model_validator(mode="after")
    def require_update(self) -> "ApplicationUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field is required")
        for field in ("company", "role", "status"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company: str
    role: str
    status: ApplicationStatus
    source: Literal["manual", "gmail-sync"]
    applied_date: date | None
    created_at: datetime
    updated_at: datetime
