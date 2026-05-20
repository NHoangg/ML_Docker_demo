from __future__ import annotations


class PageHinkleyDetector:
    """
    Custom Page-Hinkley Concept Drift Detector implemented from scratch.
    Used to detect significant changes in the mean of prediction error over time.
    """
    def __init__(
        self,
        delta: float = 100.0,
        threshold: float = 15000.0,
        alpha: float = 0.95,
    ) -> None:
        self.delta = delta
        self.threshold = threshold
        self.alpha = alpha  # Forgetting factor for the exponential moving average of errors
        self.mean_error = 0.0
        self.g = 0.0
        self.g_min = 0.0
        self.counter = 0
        self.history: list[dict] = []

    def update(self, error: float) -> bool:
        """
        Update detector state with a new absolute error sample.
        Returns True if a drift is detected, False otherwise.
        """
        self.counter += 1
        
        # Exponential moving average of the error
        if self.counter == 1:
            self.mean_error = error
        else:
            self.mean_error = self.alpha * self.mean_error + (1 - self.alpha) * error

        # Page-Hinkley cumulative sum
        self.g = self.g + (error - self.mean_error - self.delta)
        
        if self.g < self.g_min:
            self.g_min = self.g

        diff = self.g - self.g_min
        drift_signalled = diff > self.threshold

        self.history.append({
            "step": self.counter,
            "error": round(error, 2),
            "mean_error": round(self.mean_error, 2),
            "g": round(self.g, 2),
            "g_min": round(self.g_min, 2),
            "drift_score": round(diff, 2),
            "drift_detected": drift_signalled
        })
        
        if len(self.history) > 100:
            self.history.pop(0)

        if drift_signalled:
            self.reset()
            return True
            
        return False

    def reset(self) -> None:
        self.g = 0.0
        self.g_min = 0.0
        self.mean_error = 0.0
        self.counter = 0
