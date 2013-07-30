
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
munge = 0

outf = open('d.html', 'w')

for line in f.xreadlines():

	if munge > 0:
		m = re.match(r'^([ \t]*)</(pre|div)>', line)
		if m:
			munge -= 1
			if munge == 0:
				if for_edit:
					line = line.replace('</pre>', '</div>')
				else:
					line = line.replace('</div>', '</pre>')
		m = re.match(r'^[ \t]*<(pre|div)', line)
		if m:
			munge += 1

	if munge > 0:
		if for_edit:
			line = re.sub('&lt;', '<', line)
		else:
			line = re.sub('<', '&lt;', line)

	m = re.match(r'^([ \t]*)<(pre|div) .*class="example"', line)
	if m:
		munge += 1
		if for_edit:
			line = line.replace('<pre ', '<div ')
		else:
			line = line.replace('<div ', '<pre ')

	print >>outf, line,

import os
os.rename('d.html', 'demo.html')
