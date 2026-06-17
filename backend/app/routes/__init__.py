from . import workouts
from . import buddy
from . import admin
from . import support

# Exposes these modules when someone imports from the routes package
__all__ = ["workouts", "buddy", "admin", "support"]