"""Async wrappers for ifcopenshell operations.

This module provides async wrappers around synchronous ifcopenshell operations
to prevent blocking the FastAPI event loop during CPU-bound IFC parsing.

Uses asyncio.to_thread() to move blocking operations to a thread pool executor,
ensuring the main event loop remains responsive during large IFC file processing.
"""

import asyncio
from pathlib import Path
from typing import Any

import ifcopenshell
import ifcopenshell.file


async def async_open_ifc(file_path: str | Path) -> ifcopenshell.file:
    """Open IFC file asynchronously using thread pool.

    Args:
        file_path: Path to the IFC file

    Returns:
        Opened IFC file object

    Raises:
        FileNotFoundError: If the IFC file doesn't exist
        Exception: If the IFC file cannot be parsed

    Example:
        >>> ifc_file = await async_open_ifc("/path/to/model.ifc")
        >>> elements = ifc_file.by_type("IfcWall")
    """
    def _open_ifc() -> ifcopenshell.file:
        """Synchronous IFC file opening operation."""
        if not Path(file_path).exists():
            raise FileNotFoundError(f"IFC file not found: {file_path}")

        try:
            return ifcopenshell.open(file_path)
        except Exception as e:
            raise Exception(f"Failed to parse IFC file {file_path}: {str(e)}") from e

    # Use asyncio.to_thread() to run blocking operation in thread pool
    # This is available in Python 3.11+ and is the recommended approach
    return await asyncio.to_thread(_open_ifc)


async def async_get_elements_by_type(
    ifc_file: ifcopenshell.file,
    element_type: str
) -> list[Any]:
    """Get IFC elements by type asynchronously.

    Args:
        ifc_file: Opened IFC file object
        element_type: IFC element type (e.g., "IfcWall", "IfcSlab")

    Returns:
        List of IFC elements matching the type

    Example:
        >>> ifc_file = await async_open_ifc("/path/to/model.ifc")
        >>> walls = await async_get_elements_by_type(ifc_file, "IfcWall")
    """
    def _get_elements() -> list[Any]:
        """Synchronous element retrieval operation."""
        return ifc_file.by_type(element_type)

    return await asyncio.to_thread(_get_elements)


async def async_get_property_value(
    element: Any,
    property_name: str,
    pset_name: str | None = None
) -> Any | None:
    """Get property value from IFC element asynchronously.

    Args:
        element: IFC element
        property_name: Property name to retrieve
        pset_name: Optional property set name

    Returns:
        Property value or None if not found

    Example:
        >>> wall = walls[0]
        >>> load_bearing = await async_get_property_value(
        ...     wall, "LoadBearing", "Pset_WallCommon"
        ... )
    """
    def _get_property() -> Any | None:
        """Synchronous property retrieval operation."""
        try:
            if pset_name:
                psets = element.IsDefinedBy
                for definition in psets:
                    if hasattr(definition, 'RelatingPropertyDefinition'):
                        pset = definition.RelatingPropertyDefinition
                        if pset.Name == pset_name:
                            for prop in pset.HasProperties:
                                if prop.Name == property_name:
                                    return prop.NominalValue.wrappedValue
            else:
                # Search all property sets
                psets = element.IsDefinedBy
                for definition in psets:
                    if hasattr(definition, 'RelatingPropertyDefinition'):
                        pset = definition.RelatingPropertyDefinition
                        if hasattr(pset, 'HasProperties'):
                            for prop in pset.HasProperties:
                                if prop.Name == property_name:
                                    return prop.NominalValue.wrappedValue
        except (AttributeError, KeyError, IndexError):
            pass

        return None

    return await asyncio.to_thread(_get_property)
