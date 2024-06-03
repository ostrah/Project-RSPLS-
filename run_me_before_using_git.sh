#!/bin/bash

# set dirs an files list in config file
. $0-config

echo "===== Processing dirs ====="
# chek if MOUNT_DIR variable not empty
if [ -z "${MOUNT_DIR}" ]
then
      echo "\${MOUNT_DIR} is empty"
      echo "Ignoring mounting of DIR"

else
	# procesing MOUNT_DIR content
	for DIR in ${MOUNT_DIR}
	do
		# make path to dir canonical -- if path starts from / it removed
		DIR=$(echo ${DIR} | sed 's/^\///')
		# make path to dir canonical -- if path ends on / it removed
		DIR=$(echo ${DIR} | sed 's/\/$//')
		# chek if such ${DIR} exists in system
		if [ -d /${DIR} ]
		then
			# chek if dir allready mounted
			if mount | grep ${DIR}
			then
				echo "===== ${DIR} is allready moounted nothing to do ====="
			else
			        # chek if dir exist in local workplace
				if [  -d "${DIR}" ]
			        then
       			   		echo "===== ${DIR} exist nothing to do ====="
	       			else
      	        		  	# create dirs if they not exist
					mkdir -p ${DIR}
        	  		      	echo "+++++ empty ${DIR} created +++++"
		        	fi
				echo "+++++ mounting /${DIR} folder +++++"
				# mount dir
				mount --bind /${DIR} ${DIR}
				echo "+++++ done +++++"
			fi
		else
  			echo "Warning! /${DIR} does not exist in system, check MOUNT_DIR!"
		fi

	done
	echo "===== All dirs are mounted ====="
fi
echo "===== End of dirs processing ====="

echo "===== Processing files ====="
# chek if MOUNT_FILE variable not empty
if [ -z "${MOUNT_FILE}" ]
then
      echo "\${MOUNT_FILE} is empty"
      echo "Ignoring mounting of FILE"

else
	# procesing MOUNT_FILE content
	for FILE in ${MOUNT_FILE}
	do
		# make path to file canonical -- if path starts from / it removed
		FILE=$(echo ${FILE} | sed 's/^\///')
		# make path to file canonical -- if path ends on / it removed
		FILE=$(echo ${FILE} | sed 's/\/$//')
		# chek if such ${FILE} exists in system
		if [ -f /${FILE} ]
                then
			# chek if file allready mounted
			if mount | grep ${FILE}
			then
				echo "===== ${FILE} is allready moounted ====="
			else
				# chek if file exist in local workplace
				if [ -a ${FILE} ]
				then
					echo "===== ${FILE} exist nothing to do ====="
				else
					# create file if it does not exist
					touch ${FILE}
					echo "+++++ empty ${FILE} created +++++"
				fi
				echo "+++++ mounting /${FILE} file +++++"
				# mount file
				mount --bind /${FILE} ${FILE}
				echo "+++++ done +++++"
			fi
		else
			echo "Warning! /${FILE} does not exist in system, check MOUNT_FILE!"
		fi
	done
	echo "===== All files are mounted ====="
fi
echo "===== End of files processing ====="
