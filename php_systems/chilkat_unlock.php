<?php

	function unlock_chilkat() {
		$glob = new CkGlobal();
		$success = $glob->UnlockBundle('Anything for 30-day trial');
		if ($success != true) {
		    print $glob->lastErrorText() . "\n";
		    exit;
		}
		
		$status = $glob->get_UnlockStatus();
		if ($status == 2) {
		    print 'Unlocked using purchased unlock code.' . "\n";
		}
		else {
		    print 'Unlocked in trial mode.' . "\n";
		}
	
		print $glob->lastErrorText() . "\n";
	}		
?>