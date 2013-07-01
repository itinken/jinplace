
import sys, re

#
# The way I am using the syntax highlighter means that all tags must
# be escaped to get the required line breaks in the example text.
#
# Thats hard to edit, so I switch to html for editing and back to
# escaped text for viewing. This script is used for that.
# 
# Arguments:
#  edit : puts the file in editing mode; all tags are present.
#  view : puts the file back into viewing mode. All examples are
#         converted to text; ie the '<' symbols are converted to
#         '&lt;'
#

if len(sys.argv) < 2:
	print 'Usage: demo_edit {edit|view}'
	sys.exit(1)

for_edit = False
if sys.argv[1] == 'edit':
	for_edit = True

f = open('demo.html')
munge = False

outf = open('d.html', 'w')

for line in f.xreadlines():

	if munge:
		m = re.match(r'^([ \t]*)</div>', line)
		if m and len(m.group(1)) <= munge:
			munge = 0

	if munge:
		if for_edit:
			line = re.sub('&lt;', '<', line)
		else:
			line = re.sub('<', '&lt;', line)

	m = re.match(r'^([ \t]*).*class="example"', line)
	if m:
		munge = len(m.group(1))

	print >>outf, line,

import os
os.rename('d.html', 'demo.html')
