from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from postgrest.exceptions import APIError

from app.db import supabase
from app.dependencies import get_current_user
from app.models.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def _database_error(_exc: APIError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not complete the application request",
    )


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    application: ApplicationCreate,
    user_id: str = Depends(get_current_user),
) -> ApplicationResponse:
    values = application.model_dump(mode="json", exclude_none=True)
    values["user_id"] = user_id
    values["source"] = "manual"
    try:
        result = supabase.table("applications").insert(values).select("*").execute()
    except APIError as exc:
        raise _database_error(exc) from exc
    return ApplicationResponse.model_validate(result.data[0])


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    user_id: str = Depends(get_current_user),
) -> list[ApplicationResponse]:
    try:
        result = (
            supabase.table("applications")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as exc:
        raise _database_error(exc) from exc
    return [ApplicationResponse.model_validate(row) for row in result.data]


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: UUID,
    user_id: str = Depends(get_current_user),
) -> ApplicationResponse:
    try:
        result = (
            supabase.table("applications")
            .select("*")
            .eq("id", str(application_id))
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        raise _database_error(exc) from exc
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return ApplicationResponse.model_validate(result.data[0])


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: UUID,
    application: ApplicationUpdate,
    user_id: str = Depends(get_current_user),
) -> ApplicationResponse:
    try:
        result = (
            supabase.table("applications")
            .update(application.model_dump(mode="json", exclude_unset=True))
            .eq("id", str(application_id))
            .eq("user_id", user_id)
            .select("*")
            .execute()
        )
    except APIError as exc:
        raise _database_error(exc) from exc
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return ApplicationResponse.model_validate(result.data[0])


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: UUID,
    user_id: str = Depends(get_current_user),
) -> Response:
    try:
        result = (
            supabase.table("applications")
            .delete()
            .eq("id", str(application_id))
            .eq("user_id", user_id)
            .select("id")
            .execute()
        )
    except APIError as exc:
        raise _database_error(exc) from exc
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
