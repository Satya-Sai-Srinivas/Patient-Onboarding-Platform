"""
Broadcasting Service - High-level methods for common broadcast operations
Simplifies broadcasting from API endpoints
"""

import logging
from typing import Optional, Dict, Any
from realtime.services.event_broadcaster import (
    broadcast_status_changed,
    broadcast_visit_created,
    broadcast_public_display_update,
    broadcast_clinician_dashboard_update,
    broadcast_admin_dashboard_update,
    broadcast_dashboard_stats
)
from realtime.schemas.event import (
    StatusChangedEvent,
    VisitCreatedEvent,
    PublicDisplayUpdateEvent,
    ClinicianDashboardUpdateEvent,
    AdminDashboardUpdateEvent,
    DashboardStatsEvent
)

logger = logging.getLogger(__name__)


class BroadcastService:
    """
    High-level service for broadcasting events from API endpoints
    Handles error logging and simplifies event creation
    """
    
    @staticmethod
    async def broadcast_appointment_started(
        ticket_id: int,
        visit_id: int,
        patient_name: str,
        old_status: str = "WAITING",
        doctor_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Broadcast when an appointment is started
        
        Args:
            ticket_id: Queue ticket ID
            visit_id: Visit ID
            patient_name: Patient's name
            old_status: Previous status (default: WAITING)
            doctor_id: Optional doctor ID
            metadata: Additional data to include
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = StatusChangedEvent(
                event_type="status_changed",  # Added this field
                entity_type="queue",
                entity_id=ticket_id,
                old_status=old_status,
                new_status="IN_PROGRESS",
                doctor_id=doctor_id,
                metadata={
                    "patient_name": patient_name,
                    "visit_id": visit_id,
                    "action": "appointment_started",
                    **(metadata or {})
                }
            )
            
            await broadcast_status_changed(event)
            logger.info(f"Broadcasted appointment start: Ticket #{ticket_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast appointment start: {e}")
            return False
    
    @staticmethod
    async def broadcast_appointment_completed(
        ticket_id: int,
        visit_id: int,
        patient_name: str,
        doctor_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Broadcast when an appointment is completed
        
        Args:
            ticket_id: Queue ticket ID
            visit_id: Visit ID
            patient_name: Patient's name
            doctor_id: Optional doctor ID
            metadata: Additional data to include
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = StatusChangedEvent(
                event_type="status_changed",  # Added this field
                entity_type="queue",
                entity_id=ticket_id,
                old_status="IN_PROGRESS",
                new_status="COMPLETED",
                doctor_id=doctor_id,
                metadata={
                    "patient_name": patient_name,
                    "visit_id": visit_id,
                    "action": "appointment_completed",
                    **(metadata or {})
                }
            )
            
            await broadcast_status_changed(event)
            logger.info(f"Broadcasted appointment completion: Ticket #{ticket_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast appointment completion: {e}")
            return False
    
    @staticmethod
    async def broadcast_patient_called(
        ticket_id: int,
        visit_id: int,
        patient_name: str,
        doctor_id: Optional[int] = None,
        room_number: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Broadcast when a patient is called
        
        Args:
            ticket_id: Queue ticket ID
            visit_id: Visit ID
            patient_name: Patient's name
            doctor_id: Optional doctor ID
            room_number: Optional room number
            metadata: Additional data to include
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = StatusChangedEvent(
                event_type="status_changed",  # MUST INCLUDE THIS!
                entity_type="queue",
                entity_id=ticket_id,
                old_status="WAITING",
                new_status="CALLED",
                doctor_id=doctor_id,
                metadata={
                    "patient_name": patient_name,
                    "visit_id": visit_id,
                    "room_number": room_number,
                    "action": "patient_called",
                    **(metadata or {})
                }
            )
            
            await broadcast_status_changed(event)
            logger.info(f"Broadcasted patient called: Ticket #{ticket_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast patient called: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    @staticmethod
    async def broadcast_patient_checked_in(
        visit_id: int,
        patient_id: int,
        patient_name: str,
        ticket_id: int,
        queue_position: int,
        doctor_id: Optional[int] = None,
        check_in_method: str = "UNKNOWN",
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Broadcast when a patient checks in
        
        Args:
            visit_id: Visit ID
            patient_id: Patient ID
            patient_name: Patient's name
            ticket_id: Queue ticket ID
            queue_position: Position in queue
            doctor_id: Optional doctor ID
            check_in_method: Method used (OTP, QR, SMS, etc.)
            metadata: Additional data to include
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = VisitCreatedEvent(
                event_type="visit_created",  # Added this field
                visit_id=visit_id,
                patient_id=patient_id,
                patient_name=patient_name,
                doctor_id=doctor_id,
                queue_position=queue_position,
                data={
                    "ticket_id": ticket_id,
                    "check_in_method": check_in_method,
                    "action": "patient_checked_in",
                    **(metadata or {})
                }
            )
            
            await broadcast_visit_created(event)
            logger.info(f"Broadcasted check-in: Visit #{visit_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast check-in: {e}")
            return False
    
    @staticmethod
    async def broadcast_queue_update(
        data: Dict[str, Any]
    ) -> bool:
        """
        Broadcast general queue update to public display
        
        Args:
            data: Queue data to broadcast
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = PublicDisplayUpdateEvent(
                event_type="public_display_update",  # Added this field
                data=data
            )
            
            await broadcast_public_display_update(event)
            logger.info(f"Broadcasted queue update")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast queue update: {e}")
            return False
    
    @staticmethod
    async def broadcast_clinician_update(
        clinician_id: int,
        data: Dict[str, Any]
    ) -> bool:
        """
        Broadcast update to specific clinician dashboard
        
        Args:
            clinician_id: Clinician ID
            data: Update data
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = ClinicianDashboardUpdateEvent(
                event_type="clinician_dashboard_update",  # Added this field
                clinician_id=clinician_id,
                data=data
            )
            
            await broadcast_clinician_dashboard_update(event)
            logger.info(f"Broadcasted clinician update: Clinician #{clinician_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast clinician update: {e}")
            return False
    
    @staticmethod
    async def broadcast_admin_update(
        data: Dict[str, Any]
    ) -> bool:
        """
        Broadcast update to admin dashboard
        
        Args:
            data: Update data
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = AdminDashboardUpdateEvent(
                event_type="admin_dashboard_update",  # Added this field
                data=data
            )
            
            await broadcast_admin_dashboard_update(event)
            logger.info(f"Broadcasted admin update")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast admin update: {e}")
            return False
    
    @staticmethod
    async def broadcast_system_stats(
        total_patients: int = 0,
        waiting_patients: int = 0,
        in_service_patients: int = 0,
        completed_today: int = 0,
        average_wait_time: float = 0.0,
        active_clinicians: int = 0
    ) -> bool:
        """
        Broadcast system statistics to admin dashboard
        
        Args:
            total_patients: Total patients today
            waiting_patients: Currently waiting
            in_service_patients: Currently in service
            completed_today: Completed today
            average_wait_time: Average wait time in minutes
            active_clinicians: Number of active clinicians
            
        Returns:
            bool: True if broadcast succeeded, False otherwise
        """
        try:
            event = DashboardStatsEvent(
                total_patients=total_patients,
                waiting_patients=waiting_patients,
                in_service_patients=in_service_patients,
                completed_today=completed_today,
                average_wait_time=average_wait_time,
                active_clinicians=active_clinicians
            )
            
            await broadcast_dashboard_stats(event)
            logger.info(f"Broadcasted system stats")
            return True
            
        except Exception as e:
            logger.error(f"Failed to broadcast system stats: {e}")
            return False


# Create singleton instance
broadcast_service = BroadcastService()