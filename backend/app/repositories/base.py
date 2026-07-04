"""
HR Nexus — Generic CRUD Repository

Abstract data access layer implementing common database operations
using SQLAlchemy 2.0 async patterns. Specific repositories inherit from this.
"""

from typing import Any, Generic, Sequence, Type, TypeVar
import uuid

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic repository providing standard CRUD operations for any SQLAlchemy model.
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: uuid.UUID | str) -> ModelType | None:
        """Fetch a single entity by its primary key UUID."""
        if isinstance(id, str):
            try:
                id = uuid.UUID(id)
            except ValueError:
                return None
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[ModelType]:
        """Fetch a list of entities with pagination."""
        query = select(self.model).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count(self) -> int:
        """Count total entities in table."""
        query = select(func.count()).select_from(self.model)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def create(self, obj_in: dict[str, Any] | Any) -> ModelType:
        """Create a new entity in the database."""
        if isinstance(obj_in, dict):
            db_obj = self.model(**obj_in)
        else:
            db_obj = self.model(**obj_in.model_dump(exclude_unset=True))

        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(
        self, db_obj: ModelType, obj_in: dict[str, Any] | Any
    ) -> ModelType:
        """Update an existing entity."""
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, id: uuid.UUID | str) -> bool:
        """Delete an entity by its ID."""
        if isinstance(id, str):
            try:
                id = uuid.UUID(id)
            except ValueError:
                return False
        result = await self.db.execute(delete(self.model).where(self.model.id == id))
        await self.db.flush()
        return result.rowcount > 0
